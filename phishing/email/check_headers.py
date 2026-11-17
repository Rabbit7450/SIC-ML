"""Verifica presencia y resultado declarado de SPF, DKIM y DMARC en un .eml."""

from __future__ import annotations

import argparse
import json
from email import policy
from email.parser import BytesParser


def parse_auth(value: str) -> dict:
    low = value.lower()
    return {
        "spf": "pass" if "spf=pass" in low else ("fail" if "spf=fail" in low else "absent"),
        "dkim": "pass" if "dkim=pass" in low else ("fail" if "dkim=fail" in low else "absent"),
        "dmarc": "pass" if "dmarc=pass" in low else ("fail" if "dmarc=fail" in low else "absent"),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--eml", required=True)
    args = parser.parse_args()
    with open(args.eml, "rb") as fh:
        msg = BytesParser(policy=policy.default).parse(fh)
    auth = msg.get("Authentication-Results", "") or msg.get("ARC-Authentication-Results", "")
    result = {
        "from": msg.get("From"),
        "return_path": msg.get("Return-Path"),
        "authentication_results": auth,
        **parse_auth(auth),
        "has_dkim_signature": bool(msg.get("DKIM-Signature")),
        "received_spf": msg.get("Received-SPF"),
    }
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
