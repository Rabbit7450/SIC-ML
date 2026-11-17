# Módulo IDS

## Laboratorio

`docker compose up -d` levanta Elasticsearch, Kibana y Filebeat. El servicio Suricata usa el perfil `linux-ids` (requiere Linux y una interfaz real).

En Windows, valida el pipeline indexando el evento de ejemplo:

```bash
python -m ids.inference.inject_sample_alert
```

Luego crea en Kibana el data view `sicml-*`.

## ML

NSL-KDD es el dataset de arranque. CIC-IDS2017 se documenta como extensión por tamaño.

```bash
python ids/ml/download_nsl_kdd.py
python ids/ml/preprocess.py
python ids/ml/train_models.py
python ids/ml/evaluate_official.py
```

El bundle de inferencia versionable queda en `ids/ml/artifacts/`: modelo activo, MLP entrenado, scaler, encoder, nombres de features, manifiesto y métricas. Los arreglos de entrenamiento preprocesados siguen locales y no se versionan por su tamaño.
