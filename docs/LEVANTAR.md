# Levantar SIC-ML · todos los comandos

Orden recomendado. Todos los comandos se ejecutan **desde la raíz del repo** (`SIC-ML-main/`), salvo que indique lo contrario.

## 0. Requisitos

| Componente | Versión usada | Para qué |
| --- | --- | --- |
| Python | 3.14 (sirve 3.10+) | servicios IDS, anti-phishing, IoT |
| Node.js | v24 (sirve 20+) | app web `sic-ml-web` |
| PostgreSQL | 18 en `127.0.0.1:5432` | base `sic_ml` (la misma de DBeaver) |
| Git | — | clonar el repo |
| Docker | opcional | ELK, Mosquitto, MailHog |
| DBeaver | opcional | ver la misma base que la app |

```bash
git clone <url-del-repo> SIC-ML-main   # si aún no lo tienes
cd SIC-ML-main
```

## 1. Entorno Python (servicios IDS + anti-phishing)

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env        # ajusta claves del laboratorio (MQTT, IOT, PHISHING_API_*, etc.)
```

## 2. PostgreSQL local (base `sic_ml`, usuario `sicml`)

```bash
# Crear rol y base (una vez, como superusuario postgres):
sudo -u postgres psql -c "CREATE USER sicml WITH PASSWORD 'cambia_esta_clave';"
sudo -u postgres psql -c "CREATE DATABASE sic_ml OWNER sicml;"

# Aplicar el esquema y los datos de ejemplo, en orden:
cd sic-ml-web
for f in postgres-local/001_sic_ml_local.sql postgres-local/002_local_auth.sql \
         postgres-local/003_users_and_reference_events.sql postgres-local/004_users_by_role.sql \
         postgres-local/005_seed_operational_data.sql postgres-local/006_activate_neural_network.sql; do
  PGPASSWORD='cambia_esta_clave' psql -h 127.0.0.1 -p 5432 -U sicml -d sic_ml -f "$f"
done
cd ..

# Verificar la conexión (la misma que usa la app y DBeaver):
PGPASSWORD='cambia_esta_clave' psql -h 127.0.0.1 -p 5432 -U sicml -d sic_ml -c "\dt"
```

**DBeaver:** Nueva conexión → PostgreSQL · Host `127.0.0.1` · Puerto `5432` · Base `sic_ml` · Usuario `sicml` · Contraseña `cambia_esta_clave` → *Test Connection*.

## 3. App web (`sic-ml-web`, puerto 3000)

```bash
cd sic-ml-web
cp .env.example .env.local
# Edita .env.local y confirma:
#   DATABASE_URL=postgresql://sicml:cambia_esta_clave@127.0.0.1:5432/sic_ml
#   IDS_INFERENCE_URL=http://127.0.0.1:8088
#   PHISHING_API_URL=http://127.0.0.1:8089
npm install
npm run db:check        # verifica conexión + esquema + login de prueba
npm run dev             # → http://localhost:3000
```

**Login de prueba:** `admin@lab.local` / `Admin123!` (también `analista@lab.local`/`Analista123!`, `lector@lab.local`/`Viewer123!`).

Producción:

```bash
npm run build
npm start               # puerto 3000
```

## 4. Correo SMTP (envío de credenciales desde /equipo)

Sin `SMTP_HOST` configurado, al crear/resetear una cuenta el panel muestra la contraseña **una sola vez** al admin. Para enviarla por correo:

```bash
# Servidor SMTP de prueba local (sin Docker): imprime y guarda cada correo en logs/mail-catch.txt
.venv/bin/pip install aiosmtpd
.venv/bin/python sic-ml-web/scripts/smtp-dev.py        # escucha en 127.0.0.1:1025
# (alternativa simple: .venv/bin/python -m aiosmtpd -n -l 127.0.0.1:1025)

# Con Docker (MailHog, bandeja web en http://localhost:8025):
# docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog

# En sic-ml-web/.env.local añade:
#   SMTP_HOST=127.0.0.1
#   SMTP_PORT=1025
#   SMTP_SECURE=false
#   SMTP_FROM=SIC-ML <no-reply@sic-ml.lab.local>
#   APP_URL=http://localhost:3000
#
# Para que los correos lleguen de verdad a Gmail (p. ej. adalit.tic@gmail.com):
#   SMTP_HOST=smtp.gmail.com  SMTP_PORT=587  SMTP_SECURE=false
#   SMTP_USER=tu-cuenta@gmail.com  SMTP_PASS=<contraseña de aplicación de 16 caracteres>
#   SMTP_FROM=tu-cuenta@gmail.com
# (la contraseña normal de Google NO sirve; crea una en myaccount.google.com/apppasswords.
#  Con el SMTP local de prueba los correos NO salen a internet: quedan en logs/mail-catch.txt)
```

Luego en el panel: **/equipo → Nueva cuenta** → al crearla, el usuario recibe un correo con su email y contraseña, y debe cambiarla al entrar.


## 5. Servicio anti-phishing (puerto 8089)

```bash
.venv/bin/python phishing/gen_dataset.py           # (opcional) regenera el dataset sintético sample_urls_generated.csv
.venv/bin/python phishing/train.py                 # entrena phishing/models/url_clf.joblib con ambos CSV (F1 objetivo ≥ 0.90)
.venv/bin/python phishing/blocklist.py --refresh   # descarga la lista de dominios (datasets/phishing/)
.venv/bin/python -m uvicorn api:app --app-dir phishing --port 8089 &

# Verificación:
curl http://127.0.0.1:8089/health
curl -X POST http://127.0.0.1:8089/check-url -H 'Content-Type: application/json' -d '{"url":"https://github.com"}'
```

## 6. IDS: modelos + servicio de inferencia (puerto 8088)

```bash
.venv/bin/python ids/ml/download_nsl_kdd.py        # dataset NSL-KDD (si falta en datasets/nsl-kdd)
.venv/bin/python ids/ml/train_models.py            # artefactos en ids/ml/artifacts
.venv/bin/python ids/ml/evaluate_official.py       # métricas oficiales KDDTest+
.venv/bin/python -m uvicorn ids.inference.service:app --host 0.0.0.0 --port 8088 &

curl http://127.0.0.1:8088/health/models           # lo consulta la pantalla /models de la web
```

## 7. ELK + Suricata (Docker, opcional para el laboratorio IDS)

```bash
docker compose -f ids/docker-compose.yml up -d     # Elasticsearch 9200, Kibana 5601, Filebeat
.venv/bin/python -m ids.inference.inject_sample_alert   # evento sintético de prueba
# Kibana: http://localhost:5601 · data view sicml-*
```

## 8. Broker MQTT para IoT (Docker, opcional)

```bash
docker compose -f iot/broker/docker-compose.yml up -d   # Mosquitto en 1883 (ver iot/broker/mosquitto.conf)
```

## 9. Resumen de puertos

| Servicio | Puerto | URL / nota |
| --- | --- | --- |
| Web SIC-ML | 3000 | http://localhost:3000 |
| API anti-phishing (FastAPI) | 8089 | http://127.0.0.1:8089/health · /check-url |
| API inferencia IDS (FastAPI) | 8088 | http://127.0.0.1:8088/health/models |
| PostgreSQL | 5432 | `sic_ml` / `sicml` (DBeaver y la app) |
| SMTP de prueba | 1025 | aiosmtpd (consola) o MailHog 8025 (web) |
| MQTT (Mosquitto) | 1883 | tema `sicml/sensors` |
| Elasticsearch / Kibana | 9200 / 5601 | docker ids/docker-compose.yml |

## 10. Verificaciones rápidas

```bash
cd sic-ml-web
npm run db:check                                     # DB OK + esquema + login
npm run build                                        # build de producción sin errores
curl -s http://127.0.0.1:3000/api/db/health          # estado de la DB desde la web
curl -s http://127.0.0.1:8089/health                 # anti-phishing vivo
curl -s http://127.0.0.1:8088/health/models          # IDS vivo
```

## Notas de seguridad del laboratorio

- Cambia `IOT_HMAC_KEY`, `IOT_AES_KEY_HEX`, `PHISHING_API_KEY` y la contraseña de `sicml` antes de exponer nada fuera de localhost.
- Las credenciales enviadas por correo son temporales: el usuario debe cambiarlas al iniciar sesión; la contraseña nunca se guarda en `audit_logs`.
- En producción usa SMTP con TLS (puerto 465, `SMTP_SECURE=true`) y `APP_URL` con HTTPS.
