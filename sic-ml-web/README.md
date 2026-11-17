# SIC-ML Web · Centro de seguridad

App Next.js 15 (App Router) sobre **PostgreSQL local** (sin servicios externos). Todas las pantallas leen y escriben en la misma base que ves en DBeaver.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend + API | Next.js 15 |
| DB / Auth | PostgreSQL local + Drizzle (sesión por cookie `sic_user`, contraseñas bcrypt vía pgcrypto) |
| ORM | Drizzle |
| UI | Tailwind 4 + componentes tipo shadcn |
| Motion / icons / charts | Framer Motion · Lucide · Recharts |

## Soft delete

Todas las tablas importantes tienen `deleted_at` + `is_active`.

| Acción | Cómo |
| --- | --- |
| Alta | `INSERT` |
| Baja lógica | `UPDATE deleted_at=now(), is_active=false` vía `/api/soft-delete` |
| Restaurar | `action: "restore"` |
| Baja física | `action: "hard_delete"` (solo admin + confirmación) |
| Consultas | `WHERE deleted_at IS NULL` + vistas `v_*_active` |

## PostgreSQL local + DBeaver

La app y DBeaver usan el mismo servidor:

| Parámetro | Valor |
| --- | --- |
| Host | `127.0.0.1` |
| Puerto | `5432` |
| Base de datos | `sic_ml` |
| Usuario | `sicml` |
| Contraseña | la de tu instalación local (en `.env.local` como `DATABASE_URL`) |
| Driver DBeaver | PostgreSQL (JDBC) |

Para crear la conexión en DBeaver: **Nueva conexión → PostgreSQL** con los datos de arriba → *Test Connection*. El esquema vive en `postgres-local/`:

```bash
# Aplicar el esquema y los datos de ejemplo (una sola vez, en orden):
psql "postgresql://sicml:tu_clave@127.0.0.1:5432/sic_ml" -f postgres-local/001_sic_ml_local.sql
psql "postgresql://sicml:tu_clave@127.0.0.1:5432/sic_ml" -f postgres-local/002_local_auth.sql
psql "postgresql://sicml:tu_clave@127.0.0.1:5432/sic_ml" -f postgres-local/003_users_and_reference_events.sql
psql "postgresql://sicml:tu_clave@127.0.0.1:5432/sic_ml" -f postgres-local/004_users_by_role.sql
psql "postgresql://sicml:tu_clave@127.0.0.1:5432/sic_ml" -f postgres-local/005_seed_operational_data.sql
psql "postgresql://sicml:tu_clave@127.0.0.1:5432/sic_ml" -f postgres-local/006_activate_neural_network.sql
```

Cuentas iniciales: `admin@lab.local` / `Admin123!`, `analista@lab.local` / `Analista123!`, `lector@lab.local` / `Viewer123!` (rol viewer). El registro público (`/register`) crea cuentas con rol viewer.

## Envío de credenciales por correo (panel /equipo)

Al crear una cuenta o restablecer su contraseña desde **/equipo**, la API `POST/PATCH /api/admin/users` envía al correo del usuario su email y contraseña (`lib/mail.ts`, nodemailer + SMTP). Variables (solo servidor, en `.env.local`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_URL`. Sin `SMTP_HOST`, el panel muestra la contraseña **una sola vez** al admin con botón de copiar. La contraseña nunca se guarda en `audit_logs`. Prueba local: `../.venv/bin/python -m aiosmtpd -n -l 127.0.0.1:1025` (ver `docs/LEVANTAR.md` §4).

## Arranque local

```bash
cd sic-ml-web
cp .env.example .env.local   # ajusta DATABASE_URL con tu clave local
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Sin `DATABASE_URL` en producción, el panel redirige a `/setup`; en desarrollo sin base puedes usar el selector de rol demo.

## Estado de modelos

La pantalla Modelos consulta `IDS_INFERENCE_URL/health/models` y muestra la disponibilidad del servicio IDS, el artefacto activo y el estado de evaluación de la red neuronal. No marca como verificada una NN sin artefacto y métricas.

El entrenamiento NSL-KDD requiere Python compatible con TensorFlow y los artefactos preprocesados. El selector usa F1 de validación y reserva el conjunto de test para la evaluación final. Si TensorFlow no está disponible, la red neuronal se omite y su estado queda explícito.

## Análisis anti-phishing (un solo apartado)

La pantalla `/phishing` tiene **un único formulario y un único historial**. Cada análisis llama a `POST /api/phishing`, que consulta el servicio FastAPI `phishing/api.py` (`PHISHING_API_URL`, clave opcional `PHISHING_API_KEY` vía `x-api-key`): veredicto por la lista de dominios conocida (`phishing/blocklist.py`) o por el modelo ML (`phishing/train.py`), y **guarda el resultado en PostgreSQL** (`scans` con `scan_type='phishing-ml'` + `audit_logs`; ver `postgres-local/007_phishing_unificado.sql` y la vista `v_phishing_active` en DBeaver). Requiere sesión y rol con permiso de escritura (admin/analista).

Para levantar el servicio Python: `uvicorn api:app --app-dir phishing --port 8089` (desde la raíz del repo) y, si se desea, `python phishing/blocklist.py --refresh`.
