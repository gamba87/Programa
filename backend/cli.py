"""CLI for generating Programa accounting reports from JSON exports."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from backend.accounting_engine import build_isaf_xml, build_report


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate accounting reports from Programa JSON.")
    parser.add_argument("input", type=Path, help="JSON file with app-shaped data or {data, filters}.")
    parser.add_argument("--format", choices=["json", "isaf-xml"], default="json")
    parser.add_argument("--from", dest="date_from", default="")
    parser.add_argument("--to", dest="date_to", default="")
    parser.add_argument("--account", default="ALL")
    parser.add_argument("--source", default="ALL")
    parser.add_argument("--register", default="ALL")
    args = parser.parse_args()

    request = json.loads(args.input.read_text(encoding="utf-8"))
    payload = request.get("data", request)
    filters = {
        **request.get("filters", {}),
        "from": args.date_from or request.get("filters", {}).get("from", ""),
        "to": args.date_to or request.get("filters", {}).get("to", ""),
        "account": args.account,
        "source": args.source,
        "register": args.register,
    }

    if args.format == "isaf-xml":
        print(build_isaf_xml(payload, filters))
        return
    print(json.dumps(build_report(payload, filters), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

