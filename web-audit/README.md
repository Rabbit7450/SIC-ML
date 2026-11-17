# Auditoría web defensiva

El escáner cubre:

- Cabeceras de seguridad (CSP, HSTS, X-Content-Type-Options, etc.)
- Cookies (`HttpOnly`, `Secure`)
- Fugas `Server` / `X-Powered-By`
- Marcadores de secretos en HTML

DVWA u OWASP Juice Shop se instalan **en laboratorio propio**. La detección dinámica de SQLi/XSS se hace con OWASP ZAP (herramienta estándar), no con payloads en este repositorio.
