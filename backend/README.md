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
- `POST /api/accounting/report`
- `POST /api/isaf/xml`

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

