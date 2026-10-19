# Guía de despliegue

## 1. Laboratorio de visibilidad (FASE 1)

1. Instalar Docker Desktop (Windows) o Docker Engine (Ubuntu).
2. Desde `ids/`: `docker compose up -d`
3. Esperar a que Elasticsearch responda en `http://localhost:9200`
4. Abrir Kibana en `http://localhost:5601`
5. Crear data view `sicml-*`
6. Inyectar un evento sintético: `python -m ids.inference.inject_sample_alert`

Suricata escribe EVE JSON; Filebeat lo indexa. La prueba de pipeline **no** requiere escanear hosts: se usa un `eve.json` de ejemplo.

## 2. Módulo ML (FASE 2)

```bash
python ids/ml/download_nsl_kdd.py
python ids/ml/preprocess.py
python ids/ml/train_models.py
python -m uvicorn ids.inference.service:app --port 8088
```

## 3. IoT (FASE 3)

```bash
docker compose -f iot/broker/docker-compose.yml up -d
python iot/gateway/gateway.py
```

Flashear `iot/firmware/nodo_esp32.ino` en cada ESP32 (Arduino IDE o PlatformIO).

## 4. Anti-phishing y auditoría (FASE 4)

```bash
python phishing/train.py
python phishing/email/check_headers.py --eml ruta/al/correo.eml
python web-audit/scanner.py --url http://localhost:3000 --out docs/evidencia/auditoria.json
```

El escáner web **solo** evalúa cabeceras, cookies y fugas de información. No envía payloads.

## 5. Integración (FASE 5)

Todos los módulos publican el esquema de `dashboard/schemas/evento.schema.json` hacia el índice `sicml-events`.
