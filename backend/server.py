"""Small local HTTP API for the Programa Python accounting engine."""

from __future__ import annotations

import argparse
from http import HTTPStatus
from http.server import ThreadingHTTPServer

from backend.accounting_engine import build_isaf_xml, build_report
from backend.http_handlers import JsonEndpoint


class AccountingHandler(JsonEndpoint):
    server_version = "ProgramaAccounting/0.2"

    def do_GET(self) -> None:
        if self.path in {"/health", "/api/health"}:
            self.send_json({"ok": True, "service": "programa-accounting"})
            return
        self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

    def do_POST(self) -> None:
        try:
            payload, filters = self.request_data_and_filters()
            if self.path == "/api/accounting/report":
                self.send_json(build_report(payload, filters))
                return
            if self.path == "/api/isaf/xml":
                self.send_text(build_isaf_xml(payload, filters), "application/xml; charset=utf-8")
                return
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")
        except ValueError as error:
            self.send_exception(error, HTTPStatus.BAD_REQUEST)
        except Exception as error:  # pragma: no cover - defensive API boundary
            self.send_exception(error, HTTPStatus.INTERNAL_SERVER_ERROR)


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
