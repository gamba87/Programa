"""Shared HTTP helpers for local and Vercel Python API handlers."""

from __future__ import annotations

import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
from typing import Any


class JsonEndpoint(BaseHTTPRequestHandler):
    """Small dependency-free base class for JSON POST endpoints."""

    server_version = "ProgramaPythonAPI/0.2"

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_common_headers()
        self.end_headers()

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            raise ValueError("Request body must be a JSON object.")
        return parsed

    def request_data_and_filters(self) -> tuple[dict[str, Any], dict[str, Any]]:
        request = self.read_json()
        payload = request.get("data", request)
        filters = request.get("filters", {})
        if not isinstance(payload, dict):
            raise ValueError("Request data must be a JSON object.")
        if not isinstance(filters, dict):
            raise ValueError("Request filters must be a JSON object.")
        return payload, filters

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

    def send_exception(self, error: Exception, status: HTTPStatus = HTTPStatus.INTERNAL_SERVER_ERROR) -> None:
        self.send_json({"ok": False, "error": str(error)}, status=status)

    def send_common_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format: str, *args: Any) -> None:
        return
