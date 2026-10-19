"""Servicio de inferencia: recibe JSON tipo EVE y clasifica en < 5 s."""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from fastapi import FastAPI
from pydantic import BaseModel, Field

from .normalize import severity_from_label, wrap

load_dotenv()
ART = Path(__file__).resolve().parents[1] / "ml" / "artifacts"
app = FastAPI(title="SIC-ML IDS inference")
es = Elasticsearch(os.getenv("ELASTICSEARCH_URL", "http://localhost:9200"))


class EveLike(BaseModel):
    timestamp: str | None = None
    src_ip: str | None = None
    dest_ip: str | None = None
    src_port: int | None = None
    dest_port: int | None = None
    proto: str | None = None
    flow: dict[str, Any] = Field(default_factory=dict)
    alert: dict[str, Any] = Field(default_factory=dict)
    features: dict[str, float] | None = None


def load_bundle():
    model = joblib.load(ART / "best_model.joblib")
    scaler = joblib.load(ART / "scaler.joblib")
    names = joblib.load(ART / "feature_names.joblib")
    labels = joblib.load(ART / "label_encoder.joblib")
    return model, scaler, names, labels


MODEL = SCALER = NAMES = LABELS = None
if (ART / "best_model.joblib").exists():
    MODEL, SCALER, NAMES, LABELS = load_bundle()


def vectorize(event: EveLike) -> np.ndarray:
    if event.features:
        row = [float(event.features.get(name, 0.0)) for name in NAMES]
        return SCALER.transform([row])
    flow = event.flow or {}
    approx = {
        "duration": 0.0,
        "src_bytes": float(flow.get("bytes_toserver", 0)),
        "dst_bytes": float(flow.get("bytes_toclient", 0)),
        "count": float(flow.get("pkts_toserver", 0)),
        "srv_count": float(flow.get("pkts_toclient", 0)),
    }
    row = [approx.get(name, 0.0) for name in NAMES]
    return SCALER.transform([row])


@app.get("/health")
def health() -> dict:
    return {"model_loaded": MODEL is not None}


@app.post("/classify")
def classify(event: EveLike) -> dict:
    if MODEL is None:
        return {"error": "modelo no entrenado; ejecuta ids/ml/train_models.py"}
    started = time.perf_counter()
    x = vectorize(event)
    if hasattr(MODEL, "predict_proba"):
        proba = float(MODEL.predict_proba(x)[0].max())
        pred = int(MODEL.predict(x)[0])
    else:
        pred = int(MODEL.predict(x)[0])
        proba = 1.0
    label = str(LABELS.inverse_transform([pred])[0])
    elapsed_ms = (time.perf_counter() - started) * 1000
    doc = wrap(
        "ids",
        "classification",
        {
            "src_ip": event.src_ip,
            "dest_ip": event.dest_ip,
            "proto": event.proto,
            "signature": (event.alert or {}).get("signature"),
            "latency_ms": elapsed_ms,
            "feature_mode": "explicit" if event.features else "eve-approx",
        },
        attack_type=label,
        severity=severity_from_label(label, proba),
        score=proba,
    )
    try:
        es.index(index="sicml-events", document=doc)
        indexed = True
    except Exception as exc:  # laboratorio: ES puede no estar arriba
        indexed = False
        doc["index_error"] = str(exc)
    doc["within_5s"] = elapsed_ms < 5000
    return doc
