"""Mide overhead de CPU y tamaño de payload con/sin AES-CCM + HMAC (laboratorio)."""

from __future__ import annotations

import json
import time
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESCCM
from cryptography.hazmat.primitives import hashes, hmac

KEY = bytes(16)
HMAC_KEY = b"lab-key"
BODY = json.dumps({"node": "bench", "temp": 24.5, "motion": 0, "nonce": 1}).encode()
OUT = Path(__file__).resolve().parent / "overhead.json"


def timed(fn, n: int = 2000) -> float:
    start = time.perf_counter()
    for _ in range(n):
        fn()
    return (time.perf_counter() - start) * 1000 / n


def main() -> None:
    aes = AESCCM(KEY, tag_length=16)
    nonce = b"\x00" * 12

    def plain():
        return BODY

    def protected():
        blob = nonce + aes.encrypt(nonce, BODY, None)
        h = hmac.HMAC(HMAC_KEY, hashes.SHA256())
        h.update(blob)
        return blob + h.finalize()

    p = plain()
    c = protected()
    result = {
        "payload_plain_bytes": len(p),
        "payload_protected_bytes": len(c),
        "size_overhead_bytes": len(c) - len(p),
        "latency_plain_ms": timed(plain),
        "latency_protected_ms": timed(protected),
        "nota_energia": "Medir mA con INA219 en el ESP32; registrar aquí los promedios.",
    }
    OUT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
