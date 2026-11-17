"""Servidor SMTP de desarrollo para SIC-ML (sin Docker).

Escucha en 127.0.0.1:1025, imprime cada correo recibido y lo guarda en
logs/mail-catch.txt (raíz del repo) para verificar el envío de credenciales.

    .venv/bin/pip install aiosmtpd        # una vez
    .venv/bin/python sic-ml-web/scripts/smtp-dev.py

En sic-ml-web/.env.local:
    SMTP_HOST=127.0.0.1
    SMTP_PORT=1025
    SMTP_SECURE=false
"""

import time
from pathlib import Path

from aiosmtpd.controller import Controller

ROOT = Path(__file__).resolve().parents[2]
CATCH = ROOT / "logs" / "mail-catch.txt"


class Handler:
    async def handle_DATA(self, server, session, envelope):
        CATCH.parent.mkdir(parents=True, exist_ok=True)
        with CATCH.open("ab") as fh:
            fh.write(b"=== MAIL ===\n" + envelope.content + b"\n")
        print(f"[smtp-dev] de={envelope.mail_from} para={envelope.rcpt_tos}", flush=True)
        return "250 OK capturado"


if __name__ == "__main__":
    controller = Controller(Handler(), hostname="127.0.0.1", port=1025)
    controller.start()
    print("SMTP de desarrollo en 127.0.0.1:1025 (Ctrl+C para salir)", flush=True)
    while True:
        time.sleep(3600)
