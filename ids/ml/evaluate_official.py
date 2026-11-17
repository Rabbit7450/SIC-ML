"""Evalúa artefactos guardados en el split oficial KDDTest+ sin reajustarlos."""

from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.svm import LinearSVC

ART = Path(__file__).resolve().parent / "artifacts"
DATA = Path(__file__).resolve().parents[2] / "datasets" / "nsl-kdd" / "KDDTest+.txt"


def score(model, X, y) -> dict:
    pred = model.predict(X)
    return {
        "accuracy": float(accuracy_score(y, pred)),
        "precision_attack": float(precision_score(y, pred, pos_label=0, zero_division=0)),
        "recall_attack": float(recall_score(y, pred, pos_label=0, zero_division=0)),
        "f1_attack": float(f1_score(y, pred, pos_label=0, zero_division=0)),
        "confusion_matrix_labels_attack_normal": confusion_matrix(y, pred, labels=[0, 1]).tolist(),
    }


def main() -> None:
    if not DATA.exists():
        raise SystemExit("Falta KDDTest+.txt; ejecuta ids/ml/download_nsl_kdd.py")
    bundle = joblib.load(ART / "preprocessed.joblib")
    X_test, y_test = bundle["X_official_test"], bundle["y_official_test"]
    manifest = json.loads((ART / "model_manifest.json").read_text(encoding="utf-8"))
    active_name = manifest["algorithm"]
    if active_name == "neural_net_keras":
        from tensorflow import keras

        active_model = keras.models.load_model(ART / manifest["artifact"])
    else:
        active_model = joblib.load(ART / manifest["artifact"])
    models = {"neural_net" if active_name.startswith("neural_net_") else active_name: active_model}
    if active_name != "neural_net_keras" and (ART / "nn_mlp.joblib").exists():
        models["neural_net"] = joblib.load(ART / "nn_mlp.joblib")
    elif active_name != "neural_net_keras" and (ART / "nn.keras").exists():
        from tensorflow import keras

        models["neural_net"] = keras.models.load_model(ART / "nn.keras")
    svm = LinearSVC(C=1.0, dual="auto", max_iter=4000)
    svm.fit(bundle["X_train"], bundle["y_train"])
    models["svm_linear"] = svm

    results = {
        name: score(model, X_test, y_test)
        for name, model in models.items()
        if model is not None
    }
    output = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset": "ISCX NSL-KDD KDDTest+.txt (official held-out test file)",
        "records": int(len(y_test)),
        "positive_class": "attack",
        "label_mapping": {"0": "attack", "1": "normal"},
        "selection_or_threshold_tuned_on_this_test": False,
        "source_sha256": hashlib.sha256(DATA.read_bytes()).hexdigest(),
        "results": results,
    }
    target = ART / "official_test_metrics.json"
    target.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
