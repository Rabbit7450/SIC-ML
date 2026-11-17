-- Ejecutar en la base sic_ml. Carga inicial para visualizar las pantallas.
-- Los registros incluyen payload/details.source = 'seed' y no representan incidentes reales.

-- Restablece la cuenta administrativa principal.
UPDATE profiles
SET password_hash = crypt('Admin123!', gen_salt('bf')), updated_at = now(), is_active = true, deleted_at = NULL
WHERE email = 'admin@lab.local';

-- Escaneos anti-phishing de carga inicial.
INSERT INTO scans (target_url, scan_type, status, risk_level, findings, created_by, created_at)
SELECT v.target_url, 'phishing-heuristic', 'completed', v.risk_level,
  jsonb_build_array(jsonb_build_object('method', 'lexical_heuristic', 'score', v.score, 'source', 'seed')),
  p.id, v.created_at::timestamptz
FROM (VALUES
  ('https://portal-seguro.example/confirmar', 'alto', 0.92, '2026-10-28T09:15:00-04:00'),
  ('https://intranet.lab.local/informe', 'bajo', 0.12, '2026-10-29T11:40:00-04:00'),
  ('https://actualizacion-cuenta.example/login', 'alto', 0.87, '2026-11-01T08:05:00-04:00'),
  ('https://proveedor-seguro.example/factura', 'medio', 0.61, '2026-11-03T15:20:00-04:00'),
  ('https://acceso-corporativo.example/verificar', 'alto', 0.79, '2026-11-06T10:35:00-04:00')
) AS v(target_url, risk_level, score, created_at)
CROSS JOIN (SELECT id FROM profiles WHERE email = 'analista@lab.local' AND deleted_at IS NULL LIMIT 1) p
WHERE NOT EXISTS (SELECT 1 FROM scans s WHERE s.target_url = v.target_url AND s.created_at = v.created_at::timestamptz);

-- Informes de carga inicial.
INSERT INTO reports (title, report_type, summary, content, created_by, created_at)
SELECT v.title, 'security-summary', v.summary,
  jsonb_build_object('source', 'seed', 'period', v.period, 'status', 'borrador'), p.id, v.created_at::timestamptz
FROM (VALUES
  ('Resumen semanal de alertas', 'Consolidado inicial de alertas IDS, eventos IoT y referencias de inteligencia.', '2026-10-20/2026-10-26', '2026-10-27T16:00:00-04:00'),
  ('Revisión de superficie IoT', 'Inventario inicial de nodos ESP32 y estado de conectividad.', '2026-10-27/2026-11-02', '2026-11-03T16:30:00-04:00'),
  ('Seguimiento de phishing', 'Resumen de URL analizadas y niveles de riesgo clasificados.', '2026-11-03/2026-11-09', '2026-11-09T09:00:00-04:00')
) AS v(title, summary, period, created_at)
CROSS JOIN (SELECT id FROM profiles WHERE email = 'admin@lab.local' AND deleted_at IS NULL LIMIT 1) p
WHERE NOT EXISTS (SELECT 1 FROM reports r WHERE r.title = v.title AND r.created_at = v.created_at::timestamptz);

-- Eventos de auditoría de carga inicial.
INSERT INTO audit_logs (actor_id, action, entity_table, entity_id, details, created_at)
SELECT p.id, v.action, v.entity_table, NULL,
  jsonb_build_object('source', 'seed', 'description', v.description), v.created_at::timestamptz
FROM (VALUES
  ('database_seed', 'profiles', 'Cuentas locales inicializadas', '2026-10-20T08:00:00-04:00'),
  ('database_seed', 'models', 'Modelos ML registrados', '2026-10-21T10:10:00-04:00'),
  ('database_seed', 'devices', 'Inventario IoT registrado', '2026-10-24T14:30:00-04:00'),
  ('phishing_scan', 'scans', 'Escaneos de carga inicial registrados', '2026-11-06T10:35:00-04:00'),
  ('report_create', 'reports', 'Informe semanal generado', '2026-11-09T09:00:00-04:00')
) AS v(action, entity_table, description, created_at)
CROSS JOIN (SELECT id FROM profiles WHERE email = 'admin@lab.local' AND deleted_at IS NULL LIMIT 1) p
WHERE NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.action = v.action AND a.entity_table = v.entity_table AND a.created_at = v.created_at::timestamptz);

-- Comprobación de la carga.
SELECT 'scans' AS tabla, count(*) AS registros FROM scans
UNION ALL SELECT 'reports', count(*) FROM reports
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
UNION ALL SELECT 'profiles', count(*) FROM profiles WHERE deleted_at IS NULL;
