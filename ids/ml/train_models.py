"""Entrena RF, SVM y (si hay TensorFlow) una red neuronal. Compara métricas."""

from __future__ import annotations

import json
import time
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import RandomizedSearchCV
from sklearn.svm import LinearSVC

ART = Path(__file__).resolve().parent / "artifacts"


def metrics(y_true, y_pred) -> dict:
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        "report": classification_report(y_true, y_pred, zero_division=0),
    }


def maybe_keras(X_train, y_train, X_val, y_val, X_test, y_test) -> dict | None:
    try:
        from tensorflow import keras
    except Exception:
        print("TensorFlow no disponible; se omite la red neuronal.")
        return None

    model = keras.Sequential(
        [
            keras.layers.Input(shape=(X_train.shape[1],)),
            keras.layers.Dense(64, activation="relu"),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32, activation="relu"),
            keras.layers.Dense(1, activation="sigmoid"),
        ]
    )
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
    model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=8,
        batch_size=256,
        verbose=0,
    )
    pred = (model.predict(X_test, verbose=0).ravel() >= 0.5).astype(int)
    model.save(ART / "nn.keras")
    return metrics(y_test, pred)


def main() -> None:
    bundle = joblib.load(ART / "preprocessed.joblib")
    X_train, y_train = bundle["X_train"], bundle["y_train"]
    X_val, y_val = bundle["X_val"], bundle["y_val"]
    X_test, y_test = bundle["X_test"], bundle["y_test"]

    rf_search = RandomizedSearchCV(
        RandomForestClassifier(n_jobs=-1, random_state=42),
        {
            "n_estimators": [100, 200, 300],
            "max_depth": [None, 20, 40],
            "min_samples_leaf": [1, 2, 4],
        },
        n_iter=6,
        scoring="f1",
        cv=3,
        random_state=42,
        n_jobs=-1,
    )
    rf_search.fit(X_train, y_train)
    rf = rf_search.best_estimator_
    svm = LinearSVC(C=1.0, dual="auto", max_iter=4000)
    svm.fit(X_train, y_train)

    results = {
        "random_forest": {
            **metrics(y_test, rf.predict(X_test)),
            "best_params": rf_search.best_params_,
            "val_f1": float(f1_score(y_val, rf.predict(X_val))),
        },
        "svm_linear": metrics(y_test, svm.predict(X_test)),
    }
    nn = maybe_keras(X_train, y_train, X_val, y_val, X_test, y_test)
    if nn:
        results["neural_net"] = nn

    ranking = sorted(
        ((name, data["f1"]) for name, data in results.items()),
        key=lambda item: item[1],
        reverse=True,
    )
    best_name = ranking[0][0]
    chosen = rf if best_name == "random_forest" else svm
    if best_name == "random_forest":
        joblib.dump(rf, ART / "best_model.joblib")
    else:
        joblib.dump(chosen, ART / "best_model.joblib")
    joblib.dump(bundle["scaler"], ART / "scaler.joblib")
    joblib.dump(bundle["label_encoder"], ART / "label_encoder.joblib")
    joblib.dump(bundle["feature_names"], ART / "feature_names.joblib")

    summary = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "results": {k: {kk: vv for kk, vv in v.items() if kk != "report"} for k, v in results.items()},
        "reports": {k: v["report"] for k, v in results.items()},
        "best_model": best_name,
        "why": (
            f"Se elige {best_name} por F1 de test {ranking[0][1]:.4f}, "
            "priorizando equilibrio precision/recall sobre accuracy cruda."
        ),
    }
    (ART / "metrics.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({"best_model": best_name, "ranking": ranking}, indent=2))


if __name__ == "__main__":
    np.set_printoptions(suppress=True)
    main()
