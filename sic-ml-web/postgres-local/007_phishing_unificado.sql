-- 007 · Phishing unificado: un solo flujo (blocklist + modelo ML vía /api/phishing)
-- guarda en scans con scan_type = 'phishing-ml'. Índice para el historial.
CREATE INDEX IF NOT EXISTS scans_type_created_idx ON scans (scan_type, created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON COLUMN scans.scan_type IS 'phishing-heuristic (histórico) | phishing-ml (blocklist + modelo vía /api/phishing)';

-- Vista de solo lectura para DBeaver: historial unificado de phishing activos.
CREATE OR REPLACE VIEW v_phishing_active AS
SELECT id, target_url, scan_type, status, risk_level, findings, created_by, created_at
FROM scans
WHERE deleted_at IS NULL AND scan_type IN ('phishing-ml', 'phishing-heuristic')
ORDER BY created_at DESC;

SELECT scan_type, count(*) AS registros FROM v_phishing_active GROUP BY scan_type ORDER BY scan_type;
