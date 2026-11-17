-- Registra la red neuronal como modelo desplegado en la interfaz local.
UPDATE models SET is_deployed = false, updated_at = now() WHERE is_deployed = true;

INSERT INTO models (name, version, algorithm, metrics, is_deployed)
SELECT
  'NSL-KDD Neural Network MLP',
  '1.0.0',
  'neural_net_sklearn',
  '{"validation_f1":0.9953398499659013,"official_test_f1":0.8107838695061169,"official_test_accuracy":0.8147622427253371,"epochs":21}'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM models WHERE algorithm = 'neural_net_sklearn' AND deleted_at IS NULL
);

UPDATE models
SET is_deployed = true,
    metrics = '{"validation_f1":0.9953398499659013,"official_test_f1":0.8107838695061169,"official_test_accuracy":0.8147622427253371,"epochs":21}'::jsonb,
    updated_at = now()
WHERE algorithm = 'neural_net_sklearn' AND deleted_at IS NULL;

INSERT INTO audit_logs (actor_id, action, entity_table, entity_id, details)
SELECT p.id, 'deploy_neural_network', 'models', m.id,
  jsonb_build_object('artifact', 'nn_mlp.joblib', 'algorithm', 'neural_net_sklearn', 'source', 'manual_deployment')
FROM profiles p CROSS JOIN models m
WHERE p.email = 'admin@lab.local'
  AND m.algorithm = 'neural_net_sklearn'
  AND m.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs a WHERE a.action = 'deploy_neural_network' AND a.entity_id = m.id
  );

SELECT name, algorithm, is_deployed, metrics FROM models WHERE deleted_at IS NULL ORDER BY is_deployed DESC, created_at DESC;
