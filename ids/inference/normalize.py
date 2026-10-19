"""Normaliza eventos Suricata/IoT/phishing al esquema SIC-ML."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def severity_from_label(label: str, score: float) -> str:
    if label == "normal":
        return "baja"
    if score >= 0.9:
        return "critica"
    if score >= 0.75:
        return "alta"
    return "media"


def wrap(
    module: str,
    event_type: str,
    payload: dict[str, Any],
    *,
    attack_type: str = "unknown",
    severity: str = "media",
    score: float | None = None,
) -> dict[str, Any]:
    return {
        "schema": "sicml.event.v1",
        "@timestamp": utc_now(),
        "module": module,
        "event_type": event_type,
        "attack_type": attack_type,
        "severity": severity,
        "score": score,
        "payload": payload,
    }
