from __future__ import annotations

from http import HTTPStatus

from backend.accounting_engine import build_isaf_xml
from backend.http_handlers import JsonEndpoint


class handler(JsonEndpoint):
    def do_GET(self) -> None:
        self.send_json({"ok": True, "endpoint": "/api/isaf/xml", "method": "POST"})

    def do_POST(self) -> None:
        try:
            payload, filters = self.request_data_and_filters()
            self.send_text(build_isaf_xml(payload, filters), "application/xml; charset=utf-8")
        except ValueError as error:
            self.send_exception(error, HTTPStatus.BAD_REQUEST)
        except Exception as error:  # pragma: no cover - serverless safety boundary
            self.send_exception(error)
