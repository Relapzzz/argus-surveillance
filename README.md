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

Needs Bun.

```
cd frontend
bun install
bun run dev
```

App at http://localhost:5173.

## Project files

- IMPLEMENTATION_PLAN.md: phased plan for Person A (backend) and Person B (frontend).
- TASKS.md: current status.
