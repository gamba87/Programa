from __future__ import annotations

from backend.http_handlers import JsonEndpoint


class handler(JsonEndpoint):
    def do_GET(self) -> None:
        self.send_json({"ok": True, "service": "programa-python-api"})
