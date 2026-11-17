# Hardware (FASE 0 / FASE 3)

## Lista de compra recomendada

| Ítem | Cantidad | Uso |
| --- | --- | --- |
| ESP32 DevKit | 2–3 | Nodos de sensores |
| DHT22 o DHT11 | 1–2 | Temperatura / humedad |
| PIR HC-SR501 | 1 | Movimiento |
| Raspberry Pi 4 (o PC) | 1 | Gateway MQTT + Suricata |
| Fuente 5 V y cables Dupont | 1 set | Alimentación |

## Checklist de laboratorio

- [ ] Ubuntu o VM lista
- [ ] Python 3.10+
- [ ] Docker
- [ ] Git
- [ ] ESP32 reconocidos por el IDE
- [ ] Broker MQTT alcanzable desde la Wi-Fi del laboratorio
- [ ] Captura de tráfico **propia** en el gateway (Wireshark/tshark) para comparar MQTT en claro vs cifrado

La comparación de overhead (latencia, memoria, tamaño de payload) se registra en `iot/benchmarks/`. La energía se mide con INA219 o equivalente; el repositorio deja el formato de tabla, no el ataque.
