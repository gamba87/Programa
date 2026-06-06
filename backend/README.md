# Programa Python Backend

This backend is a dependency-free Python accounting engine for the existing Vite/Supabase app.

It is meant for work that is better in Python:

- accounting report generation
- trial balance checks
- i.SAF readiness validation
- simplified i.SAF XML generation
- future bank import, reconciliation, PDF, and exact XSD validation

## Run Tests

Use the bundled Codex Python runtime if `python` is not on PATH:

```powershell
C:\Users\pauli\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m unittest discover backend\tests
```

## Run Local API

```powershell
C:\Users\pauli\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m backend.server --port 8787
```

Endpoints:

- `GET /health`
- `GET /api/health`
- `POST /api/accounting/report`
- `POST /api/isaf/xml`

## Vercel Python Functions

The deployed Vite app also exposes the accounting engine through Vercel Python functions:

- `GET /api/health`
- `POST /api/accounting/report`
- `POST /api/isaf/xml`

The browser app calls these endpoints for DK CSV, PVM CSV, and i.SAF XML exports. Local Vite development falls back to the in-browser JavaScript calculations when the Python API is not running.

Request body can be either app-shaped JSON directly or:

```json
{
  "data": {},
  "filters": {
    "from": "2026-05-01",
    "to": "2026-05-31",
    "account": "ALL",
    "source": "ALL",
    "register": "ALL"
  }
}
```

## Run CLI

```powershell
C:\Users\pauli\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m backend.cli data.json --from 2026-05-01 --to 2026-05-31
```

```powershell
C:\Users\pauli\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m backend.cli data.json --format isaf-xml --from 2026-05-01 --to 2026-05-31
```
