from __future__ import annotations

from http import HTTPStatus

from backend.accounting_engine import build_report
from backend.http_handlers import JsonEndpoint


class handler(JsonEndpoint):
    def do_GET(self) -> None:
        self.send_json({"ok": True, "endpoint": "/api/accounting/report", "method": "POST"})

    def do_POST(self) -> None:
        try:
            payload, filters = self.request_data_and_filters()
            self.send_json(build_report(payload, filters))
        except ValueError as error:
            self.send_exception(error, HTTPStatus.BAD_REQUEST)
        except Exception as error:  # pragma: no cover - serverless safety boundary
            self.send_exception(error)
