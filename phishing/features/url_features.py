"""Features léxicas de URL para clasificación anti-phishing.

Incluye señales de suplantación de marca en subdominios (p. ej.
`login.paypal.com.secure-update.net`): la marca aparece en un label que no
forma parte del dominio registrable (eTLD+1) y el registrable tiene guiones.
"""

from __future__ import annotations

import ipaddress
import math
import re
from collections import Counter
from urllib.parse import urlparse

SUSPICIOUS_TLDS = {".zip", ".xyz", ".top", ".gq", ".tk", ".ml", ".cf", ".ga", ".work", ".click", ".info", ".buzz", ".cam", ".rest"}
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "t.ly", "is.gd", "rb.gy", "cutt.ly"}

# Marcas frecuentes en campañas de phishing (se detectan en subdominios).
BRANDS = {
    "paypal", "apple", "appleid", "microsoft", "microsoftonline", "office365",
    "amazon", "netflix", "facebook", "instagram", "whatsapp", "binance",
    "coinbase", "bankofamerica", "bbva", "santander", "banco", "dhl", "fedex",
    "ups", "correos", "binance", "outlook", "live", "google", "gmail", "drive",
    "dropbox", "linkedin", "twitter", "x", "telegram", "tiktok", "spotify",
    "steam", "epicgames", "roblox", "discord", "zoom", "webex", "icloud",
}


def registrable_domain(host: str) -> str:
    """Dominio registrable aproximado (eTLD+1): últimos 2 labels del host."""
    labels = [l for l in host.split(".") if l]
    return ".".join(labels[-2:]) if len(labels) >= 2 else host


def damerau_levenshtein(a: str, b: str) -> int:
    """Distancia de edición con transposición de adyacentes (Damerau):
    captura 'amazno' vs 'amazon', 'arnazon' vs 'amazon', etc."""
    la, lb = len(a), len(b)
    if a == b:
        return 0
    d = [[0] * (lb + 1) for _ in range(la + 1)]
    for i in range(la + 1):
        d[i][0] = i
    for j in range(lb + 1):
        d[0][j] = j
    for i in range(1, la + 1):
        for j in range(1, lb + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1)
    return d[la][lb]


# Confusiones visuales comunes en typosquatting/homograph:
# dígitos que parecen letras y pares de letras que parecen una sola.
VISUAL_MAP = [
    ("rn", "m"), ("vv", "w"), ("cl", "d"), ("ii", "u"), ("nn", "m"),
]
DIGIT_TO_LETTER = str.maketrans({
    "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "6": "g",
    "7": "t", "8": "b", "9": "g", "$": "s", "|": "l",
})


def normalize_visual(s: str) -> str:
    s = s.lower().translate(DIGIT_TO_LETTER)
    for a, b in VISUAL_MAP:
        s = s.replace(a, b)
    return s


def brand_distance(sld: str) -> tuple[int, str | None]:
    """Menor distancia de edición entre el SLD normalizado y las marcas.
    Devuelve (distancia, marca). La marca exacta devuelve (0, marca)."""
    sld = normalize_visual(sld)
    best = (99, None)
    for brand in BRANDS:
        b = normalize_visual(brand)
        d = damerau_levenshtein(sld, b)
        if d < best[0]:
            best = (d, brand)
    return best


def typosquat_brand(sld: str) -> tuple[int, str | None]:
    """1 si el SLD parece una marca alterada letra a letra:
    - distancia 1 si la marca es corta (len < 5), distancia 2 si es larga
    - o si la normalización visual (rn->m, 1->l, 0->o...) revela la marca
    Devuelve (flag, marca_detectada)."""
    raw = sld.lower()
    if len(raw) < 4:
        return 0, None
    norm = normalize_visual(raw)
    for brand in BRANDS:
        b = normalize_visual(brand)
        if norm == b and raw != b:
            return 1, brand  # homograph exacto tras normalizar: arnazOn->amazon
    dist, brand = brand_distance(raw)
    if brand is None:
        return 0, None
    threshold = 1 if len(brand) < 5 else 2
    if raw == normalize_visual(brand):
        return 0, None  # es la marca real
    if dist <= threshold:
        return 1, brand
    return 0, None


# Palabras típicas de señuelo en campañas de phishing.
SUSPICIOUS_WORDS = {
    "login", "signin", "verify", "verification", "account", "update", "confirm",
    "confirmation", "secure", "security", "bank", "banking", "wallet", "bonus",
    "free", "prize", "winner", "gift", "crypto", "bitcoin", "password",
    "credential", "auth", "billing", "invoice", "payment", "unlock", "suspend",
    "suspended", "limited", "urgent", "reward", "giveaway", "claim", "recover",
    "restore", "webscr", "session", "token", "otp", "2fa", "wallet", "seed",
}
_WORD_RE = re.compile(r"[a-z0-9]+")


def shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    counts = Counter(s)
    n = len(s)
    return -sum((v / n) * math.log2(v / n) for v in counts.values())


def suspicious_word_count(text: str) -> int:
    words = set(_WORD_RE.findall(text.lower()))
    return sum(1 for w in words if w in SUSPICIOUS_WORDS)


def extract(url: str) -> dict[str, float | int]:
    raw = url.strip()
    parsed = urlparse(raw if "://" in raw else f"http://{raw}")
    host = (parsed.hostname or "").lower()
    path = parsed.path or ""
    query = parsed.query or ""
    tld = ""
    if "." in host:
        tld = "." + host.rsplit(".", 1)[-1]
    ip_host = 0
    try:
        ipaddress.ip_address(host)
        ip_host = 1
    except ValueError:
        pass

    registrable = registrable_domain(host)
    subdomain = host[: -len(registrable)].rstrip(".") if host != registrable else ""
    labels = [l for l in host.split(".") if l]

    def has_brand(text: str) -> int:
        return int(any(b in text for b in BRANDS))

    # Marca en subdominio pero NO en el dominio registrable → suplantación.
    brand_mismatch = int(bool(subdomain) and has_brand(subdomain) and not has_brand(registrable))
    brand_in_registrable = has_brand(registrable)

    # Typosquatting letra a letra sobre el SLD (label del registrable).
    sld = labels[-2] if len(labels) >= 2 else host
    typosquat, typosquat_of = typosquat_brand(sld)

    return {
        "length": len(raw),
        "https": int(parsed.scheme == "https"),
        "dots": raw.count("."),
        "hyphens": host.count("-"),
        "hyphens_registrable": registrable.count("-"),
        "at_symbol": int("@" in raw),
        "double_slash_path": int(path.startswith("//") or "//" in path[1:]),
        "special_chars": len(re.findall(r"[^a-zA-Z0-9:/?&=._-]", raw)),
        "digits": sum(c.isdigit() for c in host),
        "digits_registrable": sum(c.isdigit() for c in registrable),
        "suspicious_tld": int(tld in SUSPICIOUS_TLDS),
        "shortener": int(registrable in SHORTENERS),
        "ip_in_host": ip_host,
        "punycode": int("xn--" in host),
        "path_length": len(path),
        "query_length": len(query),
        "subdomains": max(len(labels) - 2, 0),
        "has_login": int(any(w in raw.lower() for w in ("login", "verify", "signin", "account", "update", "secure", "wallet", "billing", "confirm", "password"))),
        "brand_in_registrable": brand_in_registrable,
        "brand_mismatch": brand_mismatch,
        "typosquat": typosquat,
        "digits_sld": sum(c.isdigit() for c in sld),
        "sld_length": len(sld),
        "has_port": int(parsed.port is not None),
        "unusual_port": int(parsed.port is not None and parsed.port not in (80, 443)),
        "userinfo": int(bool(parsed.username or parsed.password)),
        "hex_encoding": int(bool(re.search(r"%[0-9a-f]{2}", path + query, re.I))),
        "query_params": (query.count("&") + 1) if query else 0,
        "path_depth": max(path.count("/") - 1, 0) if path else 0,
        "longest_label": max((len(l) for l in labels), default=0),
        "host_entropy": round(shannon_entropy(host), 3),
        "suspicious_words": suspicious_word_count(raw),
        "brand_in_path": has_brand(path + query),
        "double_ext": int(bool(re.search(r"\.[a-z0-9]{2,5}\.[a-z0-9]{2,5}$", path.lower()))),
    }


def explain(url: str) -> list[str]:
    """Señales legibles letra a letra para mostrar en la UI (api.py)."""
    raw = url.strip()
    parsed = urlparse(raw if "://" in raw else f"http://{raw}")
    host = (parsed.hostname or "").lower()
    f = extract(url)
    notes: list[str] = []
    reg = registrable_domain(host)
    if f["typosquat"]:
        _, brand = typosquat_brand(reg.split(".")[0] if "." in reg else reg)
        notes.append(f"Typosquatting: el dominio '{reg}' se parece a la marca '{brand}'.")
    if f["brand_mismatch"]:
        notes.append(f"Marca '{registrable_domain(host)}' en el subdominio; el dominio real es otro.")
    if f["hyphens_registrable"] >= 2:
        notes.append(f"El dominio registrable '{reg}' tiene varios guiones.")
    if f["punycode"]:
        notes.append("Dominio con Punycode (posible alfabeto mixto).")
    if f["digits_sld"] >= 2:
        notes.append("El dominio contiene varios dígitos (posible confusión visual).")
    return notes


FEATURE_ORDER = list(extract("https://example.com").keys())
