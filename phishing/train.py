"""Entrena un clasificador de URLs. Objetivo: F1 ≥ 0.90 en el set de laboratorio."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import train_test_split

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features.url_features import FEATURE_ORDER, extract

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "sample_urls.csv"
ART = ROOT / "models"


def vector(url: str) -> list[float]:
    feats = extract(url)
    return [float(feats[k]) for k in FEATURE_ORDER]


def main() -> None:
    df = pd.read_csv(DATA)
    x = [vector(u) for u in df["url"]]
    y = df["label"].map({"legit": 0, "phish": 1}).values
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.25, stratify=y, random_state=42
    )
    clf = RandomForestClassifier(n_estimators=300, random_state=42, class_weight="balanced")
    clf.fit(x_train, y_train)
    pred = clf.predict(x_test)
    f1 = float(f1_score(y_test, pred))
    ART.mkdir(exist_ok=True)
    joblib.dump({"model": clf, "features": FEATURE_ORDER}, ART / "url_clf.joblib")
    report = classification_report(y_test, pred, target_names=["legit", "phish"])
    (ART / "metrics.json").write_text(
        json.dumps({"f1": f1, "meets_target": f1 >= 0.90, "report": report}, indent=2),
        encoding="utf-8",
    )
    print(report)
    print("F1", f1, "objetivo 0.90", f1 >= 0.90)


if __name__ == "__main__":
    main()
