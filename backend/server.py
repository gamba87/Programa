"""Small local HTTP API for the Programa Python accounting engine."""

from __future__ import annotations

import argparse
import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from backend.accounting_engine import build_isaf_xml, build_report


class AccountingHandler(BaseHTTPRequestHandler):
    server_version = "ProgramaAccounting/0.1"

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_common_headers()
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/health":
            self.send_json({"ok": True, "service": "programa-accounting"})
            return
        self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

    def do_POST(self) -> None:
        try:
            request = self.read_json()
            payload = request.get("data", request)
            filters = request.get("filters", {})
            if self.path == "/api/accounting/report":
                self.send_json(build_report(payload, filters))
                return
            if self.path == "/api/isaf/xml":
                self.send_text(build_isaf_xml(payload, filters), "application/xml; charset=utf-8")
                return
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")
        except ValueError as error:
            self.send_json({"ok": False, "error": str(error)}, status=HTTPStatus.BAD_REQUEST)
        except Exception as error:  # pragma: no cover - defensive API boundary
            self.send_json({"ok": False, "error": str(error)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            raise ValueError("Request body must be a JSON object.")
        return parsed

    def send_json(self, value: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(value, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_common_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_text(self, value: str, content_type: str, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = value.encode("utf-8")
        self.send_response(status)
        self.send_common_headers()
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_common_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format: str, *args: Any) -> None:
        return


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Programa accounting Python API.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8787, type=int)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), AccountingHandler)
    print(f"Programa accounting API listening on http://{args.host}:{args.port}")
    server.serve_forever()


if __name__ == "__main__":
    main()

