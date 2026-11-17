"""Entrena RF, SVM y (si hay TensorFlow) una red neuronal. Compara métricas."""

from __future__ import annotations

import json
import time
from copy import deepcopy
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
    make_scorer,
)
from sklearn.model_selection import RandomizedSearchCV
from sklearn.neural_network import MLPClassifier
from sklearn.svm import LinearSVC

ART = Path(__file__).resolve().parent / "artifacts"


def metrics(y_true, y_pred) -> dict:
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, pos_label=0, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, pos_label=0, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, pos_label=0, zero_division=0)),
        "positive_class": "attack",
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=[0, 1]).tolist(),
        "report": classification_report(
            y_true, y_pred, labels=[0, 1], target_names=["attack", "normal"], zero_division=0
        ),
    }


def train_neural_network(X_train, y_train, X_val, y_val, X_test, y_test):
    try:
        from tensorflow import keras
    except Exception:
        keras = None

    ART.mkdir(parents=True, exist_ok=True)
    if keras is not None:
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
        history = model.fit(
            X_train,
            y_train,
            validation_data=(X_val, y_val),
            epochs=30,
            batch_size=256,
            callbacks=[keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True)],
            verbose=0,
        )
        val_pred = (model.predict(X_val, verbose=0).ravel() >= 0.5).astype(int)
        pred = (model.predict(X_test, verbose=0).ravel() >= 0.5).astype(int)
        model.save(ART / "nn.keras")
        artifact = "nn.keras"
        algorithm = "neural_net_keras"
        epochs = len(history.epoch)
    else:
        model = MLPClassifier(
            hidden_layer_sizes=(64, 32),
            activation="relu",
            solver="adam",
            alpha=1e-4,
            batch_size=256,
            learning_rate_init=1e-3,
            max_iter=1,
            random_state=42,
        )
        best_model = None
        best_val_f1 = -1.0
        stale_epochs = 0
        epochs = 0
        for epoch in range(1, 41):
            if epoch == 1:
                model.partial_fit(X_train, y_train, classes=np.unique(y_train))
            else:
                model.partial_fit(X_train, y_train)
            val_pred = model.predict(X_val)
            val_f1 = float(f1_score(y_val, val_pred, pos_label=0, zero_division=0))
            epochs = epoch
            if val_f1 > best_val_f1:
                best_val_f1 = val_f1
                best_model = deepcopy(model)
                stale_epochs = 0
            else:
                stale_epochs += 1
                if stale_epochs >= 6:
                    break
        if best_model is None:
            raise RuntimeError("La red neuronal no produjo un modelo válido.")
        model = best_model
        val_pred = model.predict(X_val)
        pred = model.predict(X_test)
        artifact = "nn_mlp.joblib"
        algorithm = "neural_net_sklearn"
        joblib.dump(model, ART / artifact)

    return model, {
        **metrics(y_test, pred),
        "val_f1": float(f1_score(y_val, val_pred, pos_label=0, zero_division=0)),
        "epochs": epochs,
    }, artifact, algorithm


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
        scoring=make_scorer(f1_score, pos_label=0),
        cv=3,
        random_state=42,
        n_jobs=1,
    )
    rf_search.fit(X_train, y_train)
    rf = rf_search.best_estimator_
    svm = LinearSVC(C=1.0, dual="auto", max_iter=4000)
    svm.fit(X_train, y_train)

    results = {
        "random_forest": {
            **metrics(y_test, rf.predict(X_test)),
            "best_params": rf_search.best_params_,
            "val_f1": float(f1_score(y_val, rf.predict(X_val), pos_label=0)),
        },
        "svm_linear": {
            **metrics(y_test, svm.predict(X_test)),
            "val_f1": float(f1_score(y_val, svm.predict(X_val), pos_label=0)),
        },
    }
    nn_result = train_neural_network(X_train, y_train, X_val, y_val, X_test, y_test)
    nn_model = None
    nn_artifact = None
    nn_algorithm = None
    if nn_result:
        nn_model, results["neural_net"], nn_artifact, nn_algorithm = nn_result

    ranking = sorted(
        ((name, data["val_f1"]) for name, data in results.items()),
        key=lambda item: item[1],
        reverse=True,
    )
    best_name = ranking[0][0]
    if best_name == "neural_net" and nn_model is not None and nn_artifact:
        model_artifact = nn_artifact
        manifest_algorithm = nn_algorithm
    else:
        chosen = rf if best_name == "random_forest" else svm
        joblib.dump(chosen, ART / "best_model.joblib")
        model_artifact = "best_model.joblib"
        manifest_algorithm = best_name
    joblib.dump(bundle["scaler"], ART / "scaler.joblib")
    joblib.dump(bundle["label_encoder"], ART / "label_encoder.joblib")
    joblib.dump(bundle["feature_names"], ART / "feature_names.joblib")
    (ART / "model_manifest.json").write_text(
        json.dumps(
            {"algorithm": manifest_algorithm, "artifact": model_artifact, "selection_metric": "val_f1"},
            indent=2,
        ),
        encoding="utf-8",
    )

    summary = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "results": {k: {kk: vv for kk, vv in v.items() if kk != "report"} for k, v in results.items()},
        "reports": {k: v["report"] for k, v in results.items()},
        "best_model": best_name,
        "selection_metric": "val_f1",
        "why": (
            f"Se elige {best_name} por F1 de validación {ranking[0][1]:.4f}; "
            "el conjunto de test queda reservado para evaluación."
        ),
    }
    (ART / "metrics.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({"best_model": best_name, "ranking": ranking}, indent=2))


if __name__ == "__main__":
    np.set_printoptions(suppress=True)
    main()
