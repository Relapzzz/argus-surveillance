# Project guidance

This project analyzes synthetic FIRs, call records, and transactions as an entity network. Person A owns the backend, extraction, data, and backend deployment. Person B owns the frontend.

Read TASKS.md for status and IMPLEMENTATION_PLAN.md for the phase requirements. CLAUDE.local.md contains project guidance; preserve it. Keep changes within the assigned person's scope. Complete a logical task, verify it, and update only its completed checkboxes. Do not mark work complete when required integration checks are blocked.

## Architecture and contract

- Backend: Python 3.12, uv, FastAPI, Pydantic, NetworkX. Extraction enters through app/extract/engine.py; persistence belongs behind the graph store boundary.
- Frontend: Bun, Vite, React 19, TypeScript, Tailwind v4, shadcn/ui, react-router, TanStack Query, react-force-graph-2d.
- Use backend/app/schemas.py and the implemented routers as the API contract, alongside the implementation plan. All endpoints are under /api. Graph responses contain nodes and edges. Node metrics are nested under metrics.
- Entity types: person, phone, vehicle, location, organization, account, case. IDs are deterministic; treat them as opaque strings and URL-encode them in requests.
- Graph relationships join unordered entity pairs. Preserve edge IDs, weights, attributes, and sources. Additional relationship types may occur in attributes.types.
- Case detail contains the narrative and entity character spans; graph responses omit narratives. Source IDs link to case detail.
- Frontend configuration uses VITE_API_URL, VITE_API_KEY, and VITE_USE_FIXTURE. Fixture mode uses a copy of backend/data/fixture_graph.json. Keep fixture mode explicit.
- Mutations use X-API-Key. Ingest responses provide added counts and optionally case_id, not added node IDs.

## Implementation practices

- Keep code simple and typed. Diagnose failures before fixing them. Consult current library documentation when an API is uncertain.
- Use React elements for narrative highlights, never raw HTML insertion. Preserve source text and span boundaries.
- MVP uploads accept .txt FIRs and .csv records, with a 2 MB limit. Server validation remains authoritative.
- Use synthetic data only. Do not log narratives, phone numbers, or credentials. Keep credentials in ignored environment files; examples contain no credentials.
- Use concise plain English, no emojis, and no code comments.
- With a Git checkout, use the assigned phase branch and never force-push main.

## Commands

From backend/: uv sync; uv run uvicorn app.main:app --reload; uv run pytest. The API runs at http://localhost:8000 and its docs at /docs. Use uv's --system-certs option where local TLS interception requires it.

From frontend/: bun install; bun run dev; bun run build. The frontend runs at http://localhost:5173, the default backend CORS origin.
