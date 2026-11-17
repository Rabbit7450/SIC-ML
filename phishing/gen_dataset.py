"""Genera un dataset sintético grande de URLs phish/legit para entrenar el clasificador.

    python phishing/gen_dataset.py     # -> phishing/sample_urls_generated.csv

train.py lee sample_urls.csv + sample_urls_generated.csv.
"""

from __future__ import annotations

import csv
import random
from pathlib import Path

random.seed(42)
ROOT = Path(__file__).resolve().parent
OUT = ROOT / "sample_urls_generated.csv"

BRANDS = [
    "paypal", "apple", "appleid", "microsoft", "microsoftonline", "amazon",
    "netflix", "facebook", "instagram", "whatsapp", "binance", "coinbase",
    "google", "gmail", "outlook", "dropbox", "linkedin", "telegram", "tiktok",
    "spotify", "steam", "discord", "zoom", "bankofamerica", "bbva", "santander",
    "banco", "dhl", "fedex",
]
TLD_BAD = ["xyz", "top", "gq", "tk", "ml", "cf", "ga", "work", "click", "info", "buzz", "rest", "cam", "loan", "win", "bid", "stream", "download"]
SHORT = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly"]
WORDS = ["login", "verify", "account", "update", "secure", "confirm", "signin", "billing", "wallet", "bonus", "free", "prize", "winner", "unlock", "suspend", "payment", "invoice", "recover", "session", "password", "auth", "crypto", "gift", "claim", "urgent", "limited", "otp"]
LEGIT_HOSTS = [
    "www.google.com", "github.com", "www.wikipedia.org", "www.cloudflare.com",
    "docs.python.org", "www.owasp.org", "www.ietf.org", "www.elastic.co",
    "www.paypal.com", "login.paypal.com", "www.apple.com", "appleid.apple.com",
    "login.microsoftonline.com", "www.amazon.com", "www.netflix.com",
    "www.facebook.com", "accounts.google.com", "login.bankofamerica.com",
    "www.binance.com", "web.whatsapp.com", "www.linkedin.com", "www.booking.com",
    "www.3m.com", "163.com", "www.58.com", "x.com", "www.youtube.com",
    "stackoverflow.com", "www.reddit.com", "cdn.jsdelivr.net", "pypi.org",
    "www.docker.com", "slack.com", "www.notion.so", "figma.com", "aws.amazon.com",
]
LEGIT_PATHS = ["", "/", "/login", "/signin", "/search?q=seguridad", "/es/home", "/shop", "/docs", "/en/login", "/gp/signin", "/rfc/rfc8446"]

VISUAL = {"a": "4", "e": "3", "i": "1", "o": "0", "s": "5", "t": "7", "l": "1", "g": "9", "b": "8"}


def rand_hex(n: int = 6) -> str:
    return "".join(random.choice("0123456789abcdef") for _ in range(n))


def rand_ip() -> str:
    return f"{random.randint(11, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"


def mutate_brand(b: str) -> str:
    i = random.randrange(len(b))
    return b[:i] + VISUAL.get(b[i], random.choice("0123456789")) + b[i + 1:]


def gen_phish() -> str:
    b, w, t = random.choice(BRANDS), random.choice(WORDS), random.choice(TLD_BAD)
    kind = random.randrange(10)
    if kind == 0:
        return f"https://login.{b}.com.{rand_hex(4)}.{t}"
    if kind == 1:
        return f"http://{b}.com.{w}-{rand_hex(3)}.{t}/{w}"
    if kind == 2:
        return f"https://{mutate_brand(b)}.com/{w}"
    if kind == 3:
        return f"http://{rand_ip()}/{w}/{rand_hex(4)}"
    if kind == 4:
        return f"http://{random.choice(SHORT)}/{rand_hex(8)}"
    if kind == 5:
        return f"http://{w}-{b}.{t}/secure/{w}"
    if kind == 6:
        return f"https://{b}.com@{rand_ip()}/{w}"
    if kind == 7:
        return f"http://{b}-{w}.{t}:{random.choice([8080, 8443, 2083, 9000])}/{w}"
    if kind == 8:
        return f"https://{b}.{rand_hex(6)}.{t}/{w}?token={rand_hex(8)}&id={rand_hex(4)}"
    return f"http://xn--{rand_hex(6)}.{t}/{w}"


def gen_legit() -> str:
    return f"https://{random.choice(LEGIT_HOSTS)}{random.choice(LEGIT_PATHS)}"


def main() -> None:
    rows = [(gen_phish(), "phish") for _ in range(300)] + [(gen_legit(), "legit") for _ in range(300)]
    random.shuffle(rows)
    with OUT.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["url", "label"])
        w.writerows(rows)
    print(f"{len(rows)} filas generadas en {OUT}")


if __name__ == "__main__":
    main()
