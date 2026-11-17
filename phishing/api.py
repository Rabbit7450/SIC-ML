"""Servicio FastAPI de verificación de URLs (lista de dominios + modelo ML).

No modifica ni reentrena el modelo: solo carga `models/url_clf.joblib` si existe.

    uvicorn api:app --app-dir phishing --port 8089
    # o: python phishing/api.py
"""

from __future__ import annotations

import hmac
import os
import sys
from pathlib import Path
from typing import Literal

import joblib
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).resolve().parent))
from blocklist import Blocklist  # noqa: E402
from features.url_features import explain, extract  # noqa: E402

load_dotenv()

MODEL_PATH = Path(__file__).resolve().parent / "models" / "url_clf.joblib"
PHISH_THRESHOLD = 0.7
SUSPICIOUS_THRESHOLD = 0.4

app = FastAPI(title="SIC-ML anti-phishing", version="0.1.0")
blocklist = Blocklist()
_model = None
_feature_order: list[str] = []


def load_model() -> bool:
    global _model, _feature_order
    if not MODEL_PATH.is_file():
        _model, _feature_order = None, []
        return False
    artifact = joblib.load(MODEL_PATH)
    _model = artifact["model"]
    _feature_order = list(artifact["features"])
    return True


load_model()


def require_key(x_api_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("PHISHING_API_KEY")
    if expected and not hmac.compare_digest(x_api_key or "", expected):
        raise HTTPException(status_code=401, detail="api key inválida")


class CheckRequest(BaseModel):
    url: str = Field(min_length=3, max_length=2048)


class CheckResponse(BaseModel):
    url: str
    verdict: Literal["phish", "suspicious", "legit", "unknown"]
    score: float | None
    source: Literal["blocklist", "model", "rules", "none"]
    blocklist_match: str | None
    model_score: float | None
    rule_score: float | None
    features: dict[str, float]
    notes: list[str]


def verdict_for(score: float) -> Literal["phish", "suspicious", "legit"]:
    if score >= PHISH_THRESHOLD:
        return "phish"
    if score >= SUSPICIOUS_THRESHOLD:
        return "suspicious"
    return "legit"


# Capa heurística determinista: suma de pesos por señal léxica fuerte.
# Se combina con el modelo: el score final es max(modelo, reglas).
RULE_WEIGHTS: dict[str, float] = {
    "typosquat": 0.55,
    "brand_mismatch": 0.50,
    "ip_in_host": 0.45,
    "at_symbol": 0.40,
    "userinfo": 0.40,
    "punycode": 0.30,
    "suspicious_tld": 0.30,
    "shortener": 0.25,
    "unusual_port": 0.20,
    "double_ext": 0.20,
    "hex_encoding": 0.15,
    "double_slash_path": 0.10,
}


def rule_score(feats: dict[str, float]) -> float:
    s = 0.0
    for key, weight in RULE_WEIGHTS.items():
        if feats.get(key):
            s += weight
    hyph = feats.get("hyphens_registrable", 0)
    if hyph >= 2:
        s += 0.20
    elif hyph == 1 and (feats.get("brand_mismatch") or feats.get("typosquat")):
        s += 0.15
    if feats.get("subdomains", 0) >= 3:
        s += 0.15
    words = feats.get("suspicious_words", 0)
    if words >= 2:
        s += 0.15
    elif words == 1:
        s += 0.05
    if feats.get("brand_in_path") and not feats.get("brand_in_registrable"):
        s += 0.30
    if not feats.get("https"):
        s += 0.10
    if feats.get("host_entropy", 0) >= 3.8:
        s += 0.15
    if feats.get("longest_label", 0) >= 20:
        s += 0.10
    return min(s, 1.0)


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "model_loaded": _model is not None,
        "blocklist_domains": len(blocklist),
    }


@app.post("/check-url", response_model=CheckResponse, dependencies=[Depends(require_key)])
def check_url(body: CheckRequest) -> CheckResponse:
    url = body.url.strip()
    feats = extract(url)
    notes: list[str] = []
    # Explicación minuciosa (letra a letra) de las señales detectadas.
    notes.extend(explain(url))

    model_score: float | None = None
    if _model is not None:
        vec = [[float(feats[k]) for k in _feature_order]]
        model_score = float(_model.predict_proba(vec)[0][1])
    else:
        notes.append("Modelo no cargado: ejecuta `python phishing/train.py`.")

    match = blocklist.lookup(url)
    if len(blocklist) == 0:
        notes.append("Lista vacía: ejecuta `python phishing/blocklist.py --refresh`.")

    rules = rule_score(feats)
    if rules >= PHISH_THRESHOLD:
        notes.append(f"Reglas heurísticas alcanzaron {rules:.2f} (≥ {PHISH_THRESHOLD}).")

    if match:
        verdict, score, source = "phish", 1.0, "blocklist"
        notes.append(f"Dominio presente en la lista de phishing: {match}.")
    else:
        candidates = [s for s in (model_score, rules) if s is not None]
        if candidates:
            combined = max(candidates)
            source = "model" if (model_score or 0) >= rules else "rules"
            verdict, score = verdict_for(combined), combined
        else:
            verdict, score, source = "unknown", None, "none"

    return CheckResponse(
        url=url,
        verdict=verdict,
        score=score,
        source=source,
        blocklist_match=match,
        model_score=model_score,
        rule_score=rules,
        features={k: float(v) for k, v in feats.items()},
        notes=notes,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.getenv("PHISHING_API_HOST", "127.0.0.1"),
        port=int(os.getenv("PHISHING_API_PORT", "8089")),
    )
