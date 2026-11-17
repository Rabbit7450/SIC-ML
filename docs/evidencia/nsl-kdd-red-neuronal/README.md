# Evidencia del entrenamiento MLP

Se entrenó un clasificador neuronal `MLPClassifier` con capas ocultas `[64, 32]`, activación ReLU, optimizador Adam y parada temprana. Cuando TensorFlow/Keras no está disponible, este modelo se guarda como `nn_mlp.joblib` y el servicio de inferencia puede cargarlo desde el manifiesto.

## Resultados

La selección del modelo usa solamente F1 de ataque en validación interna de KDDTrain+. El bosque aleatorio quedó seleccionado con F1 0,9990; el MLP obtuvo 0,9953. En la evaluación independiente del archivo oficial KDDTest+, el MLP obtuvo F1 de ataque 0,8108 (precisión 0,9686; recall 0,6972), frente a 0,7442 para el bosque aleatorio. No se cambió el modelo elegido usando ese test externo.

Estos resultados describen el benchmark NSL-KDD, que es antiguo. No representan rendimiento garantizado sobre tráfico actual. Reentrenar y evaluar con datos representativos del despliegue sigue siendo necesario antes de usarlo para decisiones operativas.

## Reproducir

Desde la raíz del repositorio, con el entorno Python configurado:

```bash
python ids/ml/download_dataset.py
python ids/ml/preprocess.py
python ids/ml/train_models.py
python ids/ml/evaluate_official.py
```

El servicio FastAPI publica el estado del modelo en `/health/models` y clasifica en `/classify`. Para habilitarlo desde el dashboard, configura `IDS_INFERENCE_URL` en `sic-ml-web`.

Las métricas completas, matriz de confusión, hash del test y versiones de librerías están en [`metrics.json`](metrics.json). Los modelos serializados se encuentran en `ids/ml/artifacts/`.
