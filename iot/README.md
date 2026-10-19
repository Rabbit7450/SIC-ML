# Módulo IoT

## Piezas

- `firmware/nodo_esp32.ino`: AES-128-CCM + HMAC-SHA256 + nonce
- `gateway/gateway.py`: valida firma, replay y frecuencia
- `gateway/simulate_node.py`: emula un nodo en PC
- `broker/`: Mosquitto
- `benchmarks/overhead.py`: latencia y tamaño con/sin protección

## Evidencia de confidencialidad (sin MITM)

Capturar **en el propio gateway** el tráfico MQTT del laboratorio:

1. Publicar un mensaje en claro (modo debug, solo lab).
2. Publicar el mismo mensaje con AES-CCM.
3. Comparar en Wireshark/tshark el payload visible vs opaco.
4. Guardar capturas propias en `docs/evidencia/`.

No se documentan procedimientos de interceptación de terceros.
