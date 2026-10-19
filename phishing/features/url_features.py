"""Features léxicas de URL para clasificación anti-phishing."""

from __future__ import annotations

import ipaddress
import re
from urllib.parse import urlparse

SUSPICIOUS_TLDS = {".zip", ".xyz", ".top", ".gq", ".tk", ".ml", ".cf", ".ga", ".work"}
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly"}


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
    return {
        "length": len(raw),
        "https": int(parsed.scheme == "https"),
        "dots": raw.count("."),
        "hyphens": host.count("-"),
        "at_symbol": int("@" in raw),
        "double_slash_path": int(path.startswith("//") or "//" in path[1:]),
        "special_chars": len(re.findall(r"[^a-zA-Z0-9:/?&=._-]", raw)),
        "digits": sum(c.isdigit() for c in host),
        "suspicious_tld": int(tld in SUSPICIOUS_TLDS),
        "shortener": int(host in SHORTENERS),
        "ip_in_host": ip_host,
        "path_length": len(path),
        "query_length": len(query),
        "subdomains": max(host.count(".") - 1, 0),
        "has_login": int("login" in raw.lower() or "verify" in raw.lower()),
    }


FEATURE_ORDER = list(extract("https://example.com").keys())
