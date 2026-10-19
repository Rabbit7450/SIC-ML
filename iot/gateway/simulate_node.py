"""Simula un nodo ESP32 en PC para probar el gateway sin hardware."""

from __future__ import annotations

import json
import os
import time

from cryptography.hazmat.primitives.ciphers.aead import AESCCM
from cryptography.hazmat.primitives import hashes, hmac
from dotenv import load_dotenv
import paho.mqtt.client as mqtt

load_dotenv()
HMAC_KEY = os.getenv("IOT_HMAC_KEY", "cambia-esta-clave-en-laboratorio").encode()
AES_KEY = bytes.fromhex(os.getenv("IOT_AES_KEY_HEX", "00112233445566778899aabbccddeeff"))
TOPIC = os.getenv("MQTT_TOPIC", "sicml/sensors")


def pack(node: str, nonce: int, body: dict) -> str:
    plain = json.dumps(body).encode()
    nce = nonce.to_bytes(12, "big")
    blob = AESCCM(AES_KEY, tag_length=16).encrypt(nce, plain, None)
    packed = nce + blob
    h = hmac.HMAC(HMAC_KEY, hashes.SHA256())
    h.update(packed)
    envelope = {
        "node": node,
        "nonce": nonce,
        "hmac": h.finalize().hex(),
        "blob": packed.hex(),
    }
    return json.dumps(envelope)


def main() -> None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(os.getenv("MQTT_HOST", "localhost"), int(os.getenv("MQTT_PORT", "1883")))
    nonce = 1
    while True:
        msg = pack("esp32-sim", nonce, {"node": "esp32-sim", "temp": 24.5, "motion": 0, "nonce": nonce})
        client.publish(TOPIC, msg)
        print("publicado", nonce)
        nonce += 1
        time.sleep(5)


if __name__ == "__main__":
    main()
