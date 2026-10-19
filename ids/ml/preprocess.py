"""Limpieza, one-hot, StandardScaler y split 70/15/15 estratificado."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "datasets" / "nsl-kdd" / "KDDTrain+.txt"
ART = Path(__file__).resolve().parent / "artifacts"
COLUMNS = [
    "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes",
    "land", "wrong_fragment", "urgent", "hot", "num_failed_logins", "logged_in",
    "num_compromised", "root_shell", "su_attempted", "num_root", "num_file_creations",
    "num_shells", "num_access_files", "num_outbound_cmds", "is_host_login",
    "is_guest_login", "count", "srv_count", "serror_rate", "srv_serror_rate",
    "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate",
    "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count",
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate",
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate", "label", "difficulty",
]
CATEGORICAL = ["protocol_type", "service", "flag"]


def load_nsl(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, header=None, names=COLUMNS)
    df = df.drop(columns=["difficulty"])
    df = df.drop_duplicates()
    df["label"] = df["label"].apply(lambda x: "normal" if x == "normal" else "attack")
    return df


def main() -> None:
    if not DATA.exists():
        raise SystemExit("Falta NSL-KDD. Ejecuta: python ids/ml/download_nsl_kdd.py")
    ART.mkdir(parents=True, exist_ok=True)
    df = load_nsl(DATA)
    y = df["label"]
    x = df.drop(columns=["label"])
    x = pd.get_dummies(x, columns=CATEGORICAL)
    feature_names = list(x.columns)

    x_train, x_temp, y_train, y_temp = train_test_split(
        x, y, test_size=0.30, stratify=y, random_state=42
    )
    x_val, x_test, y_val, y_test = train_test_split(
        x_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42
    )

    scaler = StandardScaler()
    x_train_s = scaler.fit_transform(x_train)
    x_val_s = scaler.transform(x_val)
    x_test_s = scaler.transform(x_test)

    encoder = LabelEncoder()
    y_train_e = encoder.fit_transform(y_train)
    y_val_e = encoder.transform(y_val)
    y_test_e = encoder.transform(y_test)

    joblib.dump(
        {
            "X_train": x_train_s,
            "X_val": x_val_s,
            "X_test": x_test_s,
            "y_train": y_train_e,
            "y_val": y_val_e,
            "y_test": y_test_e,
            "feature_names": feature_names,
            "scaler": scaler,
            "label_encoder": encoder,
        },
        ART / "preprocessed.joblib",
    )
    (ART / "features.json").write_text(json.dumps(feature_names, indent=2), encoding="utf-8")
    print(f"filas train/val/test: {len(x_train)} / {len(x_val)} / {len(x_test)}")
    print(f"clases: {list(encoder.classes_)}")


if __name__ == "__main__":
    main()
