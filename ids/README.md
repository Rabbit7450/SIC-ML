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

Artefactos de entrenamiento: `ids/ml/artifacts/` (ignorados por git).
