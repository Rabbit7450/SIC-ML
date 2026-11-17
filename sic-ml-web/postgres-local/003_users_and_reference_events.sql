-- Ejecutar una sola vez en la base sic_ml. Usuarios locales y referencias públicas fechadas.
-- Las alertas con source="CISA" son referencias de inteligencia pública, no incidentes de tu red.

INSERT INTO profiles (email, full_name, role, password_hash)
VALUES
  ('analista@lab.local', 'Analista SOC', 'analista', crypt('Analista123!', gen_salt('bf'))),
  ('lector@lab.local', 'Lector de Seguridad', 'viewer', crypt('Viewer123!', gen_salt('bf')))
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

INSERT INTO alerts (title, module, attack_type, severity, score, source_ip, payload, created_at)
SELECT v.title, 'threat-intel', v.attack_type, v.severity::alert_severity, v.score, NULL,
  jsonb_build_object('source', 'CISA', 'reference_url', v.reference_url, 'published_date', v.published_date, 'scope', 'Referencia pública'),
  v.published_date::timestamptz
FROM (VALUES
  ('CISA: Ghost (Cring) ransomware', 'ransomware', 'alta', 0.88, '2025-02-19T00:00:00Z', 'https://www.cisa.gov/news-events/alerts/2025/02/19/cisa-and-partners-release-advisory-ghost-cring-ransomware'),
  ('CISA: Medusa ransomware', 'ransomware', 'alta', 0.91, '2025-03-12T00:00:00Z', 'https://www.cisa.gov/news-events/alerts/2025/03/12/cisa-and-partners-release-cybersecurity-advisory-medusa-ransomware'),
  ('CISA: infraestructura fast-flux', 'command-and-control', 'media', 0.76, '2025-04-03T00:00:00Z', 'https://www.cisa.gov/news-events/alerts/2025/04/03/nsa-cisa-fbi-and-international-partners-release-cybersecurity-advisory-fast-flux-national-security'),
  ('CISA: técnica posterior a explotación Fortinet', 'post-exploitation', 'alta', 0.85, '2025-04-11T00:00:00Z', 'https://www.cisa.gov/news-events/alerts/2025/04/11/fortinet-releases-advisory-new-post-exploitation-technique-known-vulnerabilities')
) AS v(title, attack_type, severity, score, published_date, reference_url)
WHERE NOT EXISTS (SELECT 1 FROM alerts a WHERE a.title = v.title AND a.created_at = v.published_date::timestamptz);
