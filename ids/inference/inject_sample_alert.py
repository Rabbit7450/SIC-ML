"""Indexa un evento EVE de ejemplo para validar Kibana sin escanear redes."""

from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from elasticsearch import Elasticsearch

from .normalize import wrap

load_dotenv()
SAMPLE = Path(__file__).resolve().parents[1] / "suricata" / "logs" / "eve.sample.json"


def main() -> None:
    eve = json.loads(SAMPLE.read_text(encoding="utf-8"))
    doc = wrap(
        "ids",
        "suricata_alert",
        eve,
        attack_type=eve.get("alert", {}).get("category", "lab"),
        severity="media",
        score=0.5,
    )
    es = Elasticsearch(os.getenv("ELASTICSEARCH_URL", "http://localhost:9200"))
    res = es.index(index="sicml-events", document=doc)
    print(json.dumps({"indexed": res.get("result"), "id": res.get("_id")}, indent=2))


if __name__ == "__main__":
    main()
