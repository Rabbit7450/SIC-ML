"""Servicio de inferencia: recibe JSON tipo EVE y clasifica en < 5 s."""

from __future__ import annotations

import os
import json
import time
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
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
    manifest_path = ART / "model_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    algorithm = manifest.get("algorithm", "legacy_joblib")
    if algorithm == "neural_net_keras":
        from tensorflow import keras

        model = keras.models.load_model(ART / manifest.get("artifact", "nn.keras"))
    else:
        model = joblib.load(ART / manifest.get("artifact", "best_model.joblib"))
    scaler = joblib.load(ART / "scaler.joblib")
    names = joblib.load(ART / "feature_names.joblib")
    labels = joblib.load(ART / "label_encoder.joblib")
    return model, scaler, names, labels, algorithm


MODEL = SCALER = NAMES = LABELS = None
MODEL_TYPE = None
MODEL_LOAD_ERROR = None
if (ART / "model_manifest.json").exists() or (ART / "best_model.joblib").exists():
    try:
        MODEL, SCALER, NAMES, LABELS, MODEL_TYPE = load_bundle()
    except Exception as exc:
        MODEL_LOAD_ERROR = f"{type(exc).__name__}: {exc}"


@app.get("/")
def service_root() -> dict:
    """Punto de entrada legible para comprobar que el servicio IDS está activo."""
    return {
        "service": "SIC-ML IDS inference",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "models": "/health/models",
            "classify": "/classify",
            "docs": "/docs",
        },
    }


def vectorize(event: EveLike) -> np.ndarray:
    def scale(row: list[float]) -> np.ndarray:
        if hasattr(SCALER, "feature_names_in_"):
            return SCALER.transform(pd.DataFrame([row], columns=NAMES))
        return SCALER.transform([row])

    if event.features:
        row = [float(event.features.get(name, 0.0)) for name in NAMES]
        return scale(row)
    flow = event.flow or {}
    approx = {
        "duration": 0.0,
        "src_bytes": float(flow.get("bytes_toserver", 0)),
        "dst_bytes": float(flow.get("bytes_toclient", 0)),
        "count": float(flow.get("pkts_toserver", 0)),
        "srv_count": float(flow.get("pkts_toclient", 0)),
    }
    row = [approx.get(name, 0.0) for name in NAMES]
    return scale(row)


@app.get("/health")
def health() -> dict:
    return {"model_loaded": MODEL is not None, "active_model": MODEL_TYPE}


@app.get("/health/models")
def model_health() -> dict:
    metrics_path = ART / "metrics.json"
    manifest_path = ART / "model_manifest.json"
    metrics_data = {}
    if metrics_path.exists():
        try:
            metrics_data = json.loads(metrics_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            metrics_data = {}

    nn_metrics = (metrics_data.get("results") or {}).get("neural_net")
    official_metrics_path = ART / "official_test_metrics.json"
    official_metrics = {}
    if official_metrics_path.exists():
        try:
            official_metrics = json.loads(official_metrics_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            official_metrics = {}
    nn_official = (official_metrics.get("results") or {}).get("neural_net")
    nn_artifacts = [ART / "nn.keras", ART / "nn_mlp.joblib"]
    nn_artifact_present = any(path.exists() for path in nn_artifacts)
    if MODEL_LOAD_ERROR:
        nn_status = "load_error" if (nn_artifact_present or nn_metrics) else "not_trained"
    elif nn_artifact_present and nn_metrics:
        nn_status = "verified" if (MODEL_TYPE or "").startswith("neural_net_") else "evaluated"
    elif nn_artifact_present:
        nn_status = "artifact_unverified"
    elif nn_metrics:
        nn_status = "metrics_only"
    else:
        nn_status = "not_trained"

    manifest = {}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            manifest = {}

    return {
        "service_available": True,
        "model_loaded": MODEL is not None,
        "active_model": manifest.get("algorithm") or MODEL_TYPE,
        "model_load_error": MODEL_LOAD_ERROR,
        "evaluated_at": metrics_data.get("generated_at"),
        "selection_metric": metrics_data.get("selection_metric"),
        "neural_network": {
            "status": nn_status,
            "artifact_present": nn_artifact_present,
            "metrics_present": bool(nn_metrics),
            "validation_f1": (nn_metrics or {}).get("val_f1"),
            "test_f1": (nn_official or {}).get("f1_attack", (nn_metrics or {}).get("f1")),
            "accuracy": (nn_official or {}).get("accuracy", (nn_metrics or {}).get("accuracy")),
            "test_set": official_metrics.get("dataset", "split interno de KDDTrain+"),
        },
    }


@app.post("/classify")
def classify(event: EveLike) -> dict:
    if MODEL is None:
        return {"error": "modelo no entrenado; ejecuta ids/ml/train_models.py"}
    started = time.perf_counter()
    x = vectorize(event)
    if MODEL_TYPE == "neural_net_keras":
        class_one_probability = float(np.asarray(MODEL.predict(x, verbose=0)).reshape(-1)[0])
        pred = int(class_one_probability >= 0.5)
        proba = class_one_probability if pred == 1 else 1 - class_one_probability
    elif hasattr(MODEL, "predict_proba"):
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
