"""Gateway: valida HMAC-SHA256, nonce anti-replay y frecuencia; descifra AES-CCM."""

from __future__ import annotations

import json
import os
import time
from collections import defaultdict, deque

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESCCM
from cryptography.hazmat.primitives import hashes, hmac
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
import paho.mqtt.client as mqtt

load_dotenv()

HMAC_KEY = os.getenv("IOT_HMAC_KEY", "cambia-esta-clave-en-laboratorio").encode()
AES_KEY = bytes.fromhex(os.getenv("IOT_AES_KEY_HEX", "00112233445566778899aabbccddeeff"))
TOPIC = os.getenv("MQTT_TOPIC", "sicml/sensors")
MAX_HZ = 2.0
WINDOW_S = 10.0
seen_nonces: dict[str, set[int]] = defaultdict(set)
times: dict[str, deque] = defaultdict(deque)
es = Elasticsearch(os.getenv("ELASTICSEARCH_URL", "http://localhost:9200"))


def verify_hmac(blob: bytes, mac_hex: str) -> bool:
    h = hmac.HMAC(HMAC_KEY, hashes.SHA256())
    h.update(blob)
    try:
        h.verify(bytes.fromhex(mac_hex))
        return True
    except Exception:
        return False


def decrypt(blob: bytes) -> dict:
    nonce, rest = blob[:12], blob[12:]
    ct, tag = rest[:-16], rest[-16:]
    aes = AESCCM(AES_KEY, tag_length=16)
    plain = aes.decrypt(nonce, ct + tag, None)
    return json.loads(plain.decode())


def too_frequent(node: str) -> bool:
    now = time.time()
    q = times[node]
    q.append(now)
    while q and now - q[0] > WINDOW_S:
        q.popleft()
    return len(q) / WINDOW_S > MAX_HZ


def on_message(_client, _userdata, msg: mqtt.MQTTMessage) -> None:
    envelope = json.loads(msg.payload.decode())
    node = envelope["node"]
    nonce = int(envelope["nonce"])
    blob = bytes.fromhex(envelope["blob"])
    ok_mac = verify_hmac(blob, envelope["hmac"])
    replay = nonce in seen_nonces[node]
    flood = too_frequent(node)
    seen_nonces[node].add(nonce)
    status = "accepted"
    payload = None
    if not ok_mac:
        status = "invalid_hmac"
    elif replay:
        status = "replay"
    elif flood:
        status = "rate_limited"
    else:
        try:
            payload = decrypt(blob)
        except InvalidTag:
            status = "decrypt_fail"
    doc = {
        "schema": "sicml.event.v1",
        "module": "iot",
        "event_type": "sensor",
        "attack_type": status if status != "accepted" else "none",
        "severity": "alta" if status != "accepted" else "baja",
        "node": node,
        "nonce": nonce,
        "status": status,
        "payload": payload,
    }
    try:
        es.index(index="sicml-events", document=doc)
    except Exception as exc:
        print("ES no disponible:", exc)
    print(json.dumps(doc, default=str))


def main() -> None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_message = on_message
    client.connect(os.getenv("MQTT_HOST", "localhost"), int(os.getenv("MQTT_PORT", "1883")))
    client.subscribe(TOPIC)
    client.loop_forever()


if __name__ == "__main__":
    main()
