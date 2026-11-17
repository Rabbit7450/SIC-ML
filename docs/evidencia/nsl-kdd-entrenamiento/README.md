# Entrenamiento NSL-KDD (binario: attack vs normal)

Fecha: 2026-10-19

- Split estratificado: 88 181 / 18 896 / 18 896 (70/15/15)
- Clases (`LabelEncoder`): `0=attack`, `1=normal`
- TensorFlow no disponible en Python 3.14: no se entrenó la red neuronal
- Mejor modelo: Random Forest (`n_estimators=100`, `max_depth=None`, `min_samples_leaf=1`)

Métricas de test en `metrics.json`. Artefactos en `ids/ml/artifacts/` (no versionados).
