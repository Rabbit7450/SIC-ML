# SIC-ML

Sistema Integrado de Ciberseguridad con Machine Learning: IDS, IoT seguro, anti-phishing y auditoría web defensiva, con eventos normalizados hacia Elasticsearch.

## Estructura

```
/ids         Laboratorio Suricata + ELK y módulo ML
/iot         Nodos ESP32, broker MQTT y gateway
/phishing    Clasificador de URLs y verificación de cabeceras
/dashboard   Esquema JSON unificado y eventos de ejemplo
/docs        Estado del arte, DoD y guía de despliegue
/datasets    Datasets académicos (no versionados)
/web-audit   Auditoría defensiva de cabeceras y exposición
/sic-ml-web  App Next.js 15 + PostgreSQL local + Drizzle (Amber Forest, soft delete)
```

La app web vive en `sic-ml-web/` (Vercel gratis). Ver `sic-ml-web/README.md`.

## Requisitos de entorno (FASE 0)

| Herramienta | Estado esperado |
| --- | --- |
| Git | Obligatorio |
| Python 3.10+ | Obligatorio |
| Docker Desktop / Docker Engine | Recomendado para ELK y Mosquitto |
| Ubuntu (nativo o VM) | Recomendado para Suricata en modo IDS |
| 2–3 ESP32 + sensores | FASE 3 (hardware físico) |
| Raspberry Pi o PC como gateway | FASE 3 |

En este equipo de desarrollo (Windows): hay Python y Git. Docker no está instalado todavía; el laboratorio ELK se deja listo en `ids/docker-compose.yml`.

## Orden de trabajo

1. Laboratorio Suricata + Elasticsearch + Kibana + Filebeat
2. Pipeline NSL-KDD y modelos ML
3. Prototipo IoT con MQTT y cifrado ligero
4. Anti-phishing y auditoría web defensiva
5. Integración y dashboard unificado

## Arranque rápido (código)

```bash
cd SIC-ML
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

**👉 Guía completa con TODOS los comandos para levantar el proyecto** (PostgreSQL + DBeaver, web, SMTP de credenciales, anti-phishing, IDS, ELK, MQTT): [`docs/LEVANTAR.md`](docs/LEVANTAR.md).

La red neuronal es un MLP de dos capas. Usa TensorFlow/Keras cuando está disponible y cae a `sklearn.neural_network.MLPClassifier` en Python 3.14. El entrenamiento elige modelos con F1 de ataque en validación y reporta también el archivo oficial `KDDTest+` por separado.

## Qué no incluye este repositorio

No hay exploits, payloads de inyección, procedimientos de nmap ofensivo ni demostraciones de Man-in-the-Middle. Las pruebas de laboratorio se hacen con tráfico sintético, datasets públicos y captura **propia** en el gateway.

## Licencia académica

Uso exclusivo para el trabajo de grado y laboratorio autorizado.
