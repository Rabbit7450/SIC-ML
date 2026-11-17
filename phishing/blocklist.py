"""Capa 1 anti-phishing: consulta local de dominios de phishing conocidos.

Fuente por defecto: Phishing Database (mitchellkrogza), lista de dominios activos.
La lista se descarga una vez y se consulta en memoria (sin límites de peticiones).

    python phishing/blocklist.py --refresh      # descarga/actualiza la lista
    python phishing/blocklist.py --check URL    # consulta rápida por consola
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Iterator
from urllib.parse import urlparse

import httpx

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PATH = ROOT / "datasets" / "phishing" / "phishing-domains-ACTIVE.txt"
DEFAULT_URL = (
    "https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/"
    "master/phishing-domains-ACTIVE.txt"
)


def host_of(url: str) -> str:
    raw = url.strip()
    parsed = urlparse(raw if "://" in raw else f"http://{raw}")
    return (parsed.hostname or "").lower().rstrip(".")


def candidates(host: str) -> Iterator[str]:
    """host y sus dominios padre (a.b.c.com -> a.b.c.com, b.c.com, c.com)."""
    labels = host.split(".")
    for i in range(len(labels) - 1):
        yield ".".join(labels[i:])


class Blocklist:
    def __init__(self, path: str | Path | None = None) -> None:
        self.path = Path(path or os.getenv("PHISHING_BLOCKLIST_PATH") or DEFAULT_PATH)
        self.domains: set[str] = set()
        self.load()

    def load(self) -> int:
        self.domains.clear()
        paths = [self.path]
        # Lista extra local (dominio de laboratorio propio), si existe.
        extra = self.path.parent / "extra-blocklist.txt"
        if extra.is_file():
            paths.append(extra)
        for path in paths:
            if not path.is_file():
                continue
            with path.open(encoding="utf-8", errors="ignore") as fh:
                for line in fh:
                    entry = line.strip().lower()
                    if entry and not entry.startswith("#"):
                        self.domains.add(entry.rstrip("."))
        return len(self.domains)

    def lookup(self, url: str) -> str | None:
        """Devuelve el dominio de la lista que coincide, o None."""
        host = host_of(url)
        if not host:
            return None
        for cand in candidates(host):
            if cand in self.domains:
                return cand
        return None

    def __len__(self) -> int:
        return len(self.domains)


def refresh(path: Path = DEFAULT_PATH, url: str = DEFAULT_URL, timeout: float = 60.0) -> int:
    """Descarga la lista y la guarda de forma atómica. Devuelve nº de dominios."""
    resp = httpx.get(url, timeout=timeout, follow_redirects=True)
    resp.raise_for_status()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(resp.text, encoding="utf-8")
    tmp.replace(path)
    return Blocklist(path).load()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--refresh", action="store_true", help="descargar/actualizar la lista")
    parser.add_argument("--check", metavar="URL", help="consultar una URL")
    args = parser.parse_args()

    if args.refresh:
        print(f"{refresh()} dominios guardados en {DEFAULT_PATH}")
    if args.check:
        bl = Blocklist()
        match = bl.lookup(args.check)
        print(f"lista: {len(bl)} dominios · coincidencia: {match or 'ninguna'}")
    if not args.refresh and not args.check:
        parser.print_help()


if __name__ == "__main__":
    main()
