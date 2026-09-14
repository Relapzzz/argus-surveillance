# AI-Powered Criminal Network Analysis System

Smart India Hackathon 2026 project for the National Crime Records Bureau. It reads FIRs, call records and bank transactions, extracts people, phones, vehicles, places and organizations, links them into a network, ranks the key players, flags suspicious patterns and shows it all on an interactive graph.

All data in this repository is synthetic.

## Run the backend

Needs uv and Python 3.12.

```
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

API docs at http://localhost:8000/docs.

## Run the frontend

Needs Bun. Copy frontend/.env.example to frontend/.env and set VITE_API_KEY to the API_KEY from backend/.env.

```
cd frontend
bun install
bun run dev
```

App at http://localhost:5173.

## Demo

The seed network is committed, so the demo needs no network access and no LLM key.

1. Briefing: the summary, key players and leads are computed from the seeded records.
2. Network: the shaded areas are the groups the system found. Open the go-between lead on the briefing to highlight the person who links the two gangs.
3. Route tab: trace phone 9774964990, a complainant, to Aslam Khan.
4. Alerts tab: structuring, call burst and night call patterns with their evidence.
5. Add records: upload backend/data/demo/FIR-2026-0041.txt. It names one member of each gang, and its extraction is cached in backend/data/cache.
6. Reset network on the same page restores the seed. Restarting the backend does the same.

## Project files

- IMPLEMENTATION_PLAN.md: phased plan for Person A (backend) and Person B (frontend).
- TASKS.md: current status.
