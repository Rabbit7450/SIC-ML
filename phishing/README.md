# Anti-phishing

- Features léxicas en `features/url_features.py`
- Entrenamiento: `python phishing/train.py` (objetivo F1 ≥ 0.90) → `models/url_clf.joblib`
- Lista de dominios conocidos: `python phishing/blocklist.py --refresh` (guarda en `datasets/phishing/phishing-domains-ACTIVE.txt`) y `--check URL`
- API de verificación: `uvicorn api:app --app-dir phishing --port 8089` (o `python phishing/api.py`)
  - `GET /health` · `POST /check-url {"url": "..."}` (cabecera opcional `x-api-key` si `PHISHING_API_KEY` está definida)
  - Veredicto: `phish` si el dominio está en la lista, si no usa el score del modelo (`phish` ≥ 0.7, `suspicious` ≥ 0.4, `legit` < 0.4)
- Cabeceras de correo: `python phishing/email/check_headers.py --eml correo.eml`

La app web (`sic-ml-web`) consume la API vía `POST /api/phishing` usando `PHISHING_API_URL`.

El CSV de ejemplo es de laboratorio. Sustituirlo por un dataset académico (p. ej. ISCX-URL2016 o PhishTank autorizado) para la memoria final.
