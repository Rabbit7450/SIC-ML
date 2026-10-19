"""Auditoría defensiva: cabeceras HTTP, cookies y exposición de metadatos.

No envía payloads de inyección ni XSS. Para DAST autorizado en DVWA/Juice Shop
usar OWASP ZAP en el laboratorio del alumno.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import httpx

HEADER_CHECKS = {
    "Content-Security-Policy": ("Alta", "Falta CSP; reduce XSS reflejado y de DOM."),
    "X-Content-Type-Options": ("Media", "Falta nosniff; riesgo de MIME sniffing."),
    "X-Frame-Options": ("Media", "Falta anti-clickjacking (o CSP frame-ancestors)."),
    "Referrer-Policy": ("Baja", "Falta control de filtrado de Referer."),
    "Permissions-Policy": ("Baja", "Falta restricción de APIs del navegador."),
    "Strict-Transport-Security": ("Alta", "Falta HSTS en HTTPS."),
}


def risk_item(severity: str, title: str, detail: str, reco: str) -> dict:
    return {"severity": severity, "title": title, "detail": detail, "recommendation": reco}


def audit(url: str) -> dict:
    findings: list[dict] = []
    parsed = urlparse(url)
    if parsed.scheme != "https":
        findings.append(
            risk_item(
                "Alta",
                "Sitio sin HTTPS",
                "La URL no usa TLS.",
                "Terminar TLS y redirigir HTTP→HTTPS.",
            )
        )
    with httpx.Client(follow_redirects=True, timeout=10.0) as client:
        resp = client.get(url)
    headers = {k.lower(): v for k, v in resp.headers.items()}

    for name, (sev, reco) in HEADER_CHECKS.items():
        if name.lower() not in headers:
            if name == "Strict-Transport-Security" and parsed.scheme != "https":
                continue
            findings.append(risk_item(sev, f"Cabecera ausente: {name}", reco, reco))

    server = headers.get("server")
    powered = headers.get("x-powered-by")
    if server:
        findings.append(
            risk_item(
                "Baja",
                "Exposición de Server",
                f"Valor: {server}",
                "Ocultar versión del servidor en el reverse proxy.",
            )
        )
    if powered:
        findings.append(
            risk_item(
                "Media",
                "Exposición X-Powered-By",
                f"Valor: {powered}",
                "Eliminar cabecera de stack tecnológico.",
            )
        )

    cookies = resp.headers.get_list("set-cookie") if hasattr(resp.headers, "get_list") else []
    if not cookies and "set-cookie" in headers:
        cookies = [headers["set-cookie"]]
    for cookie in cookies:
        low = cookie.lower()
        if "httponly" not in low:
            findings.append(
                risk_item("Alta", "Cookie sin HttpOnly", cookie[:120], "Marcar cookies de sesión HttpOnly.")
            )
        if parsed.scheme == "https" and "secure" not in low:
            findings.append(
                risk_item("Alta", "Cookie sin Secure", cookie[:120], "Marcar cookies Secure en HTTPS.")
            )

    body = resp.text[:50_000]
    sensitive_markers = ["password", "api_key", "secret", "aws_access", "private_key"]
    hits = [m for m in sensitive_markers if m in body.lower()]
    if hits:
        findings.append(
            risk_item(
                "Crítica",
                "Posible exposición de datos sensibles en HTML",
                f"Marcadores: {hits}",
                "Retirar secretos del front y rotar credenciales.",
            )
        )

    order = {"Crítica": 0, "Alta": 1, "Media": 2, "Baja": 3}
    findings.sort(key=lambda f: order.get(f["severity"], 9))
    return {
        "url": str(resp.url),
        "status_code": resp.status_code,
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "findings": findings,
        "counts": {
            sev: sum(1 for f in findings if f["severity"] == sev)
            for sev in ("Crítica", "Alta", "Media", "Baja")
        },
        "scope": "cabeceras-cookies-exposicion; sin payloads de inyección",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--out", default="docs/evidencia/auditoria.json")
    args = parser.parse_args()
    report = audit(args.url)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report["counts"], indent=2, ensure_ascii=False))
    print("reporte:", out)


if __name__ == "__main__":
    main()
