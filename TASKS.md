# TASKS

Current phase, Person A: Phase 0
Current phase, Person B: Phase 0
MVP demo: 15 September 2026
Full project: about 12 October 2026

Update this file before ending every session. Tick items, move the current phase pointer, add blockers, log decisions.

## Phase 0: Setup (both, 12 September)

- [ ] A: git init, GitHub repo created, B added as collaborator, secret scanning and Dependabot enabled
- [ ] A: backend/data/fixture_graph.json written and pushed to main
- [ ] A: backend scaffold with uv, stub API serving the fixture on every GET endpoint
- [ ] A: .env.example written, one LLM provider key confirmed with GET /models
- [ ] A: Azure for Students and GitHub Pro activated from the Student Pack
- [ ] B: frontend scaffold with Bun, Vite, Tailwind v4, shadcn/ui, react-router, TanStack Query, react-force-graph-2d
- [ ] B: app shell with sidebar navigation and dark theme, four empty pages
- [ ] B: src/api/client.ts typed against the contract, fixture fallback, .env.example
- [ ] Both: Phase 0 verify commands pass

## Phase A1: Synthetic dataset (A, 13 September morning)

- [ ] scripts/generate_dataset.py with fixed seed
- [ ] data/seed/fir/*.txt (about 40), cdr.csv, transactions.csv, persons.csv
- [ ] Planted structure verified: intermediary, burner phone, structuring accounts

## Phase A2: Regex extractors (A, 13 September)

- [ ] app/extract/regex.py
- [ ] tests/test_regex.py passing

## Phase B1: Graph canvas (B, 13 September)

- [ ] GraphCanvas renders the fixture with color by type and size by pagerank
- [ ] GraphFilters by type and community, search focuses a node
- [ ] Node click selects and zooms

## Phase A3: LLM extraction and FIR ingest (A, 13 September afternoon)

- [ ] app/config.py, app/schemas.py Extraction
- [ ] app/extract/llm.py with cache, app/extract/engine.py
- [ ] app/ingest/fir.py
- [ ] scripts/seed.py warms the cache for every seed FIR, cache committed
- [ ] Injection test FIR yields no injected entity

## Phase B2: Dashboard and entity panel (B, 13 September afternoon)

- [ ] Dashboard stat cards, KeyPlayersTable, AlertsList
- [ ] EntityPanel drawer with attributes, metrics, neighbors, sources, focus and expand

## Phase A4: Graph store, analytics, patterns, seed (A, 14 September)

- [ ] app/graph/store.py, analytics.py, patterns.py
- [ ] app/ingest/cdr.py, transactions.py, persons.py
- [ ] scripts/seed.py builds data/graph.json, committed
- [ ] Key players lists kingpin and intermediary, alerts include structuring and night_calls
- [ ] tests passing

## Phase A5: Real API (A, 14 September)

- [ ] Routers over the store, stub removed
- [ ] app/security.py API key, CORS from env, upload validation
- [ ] tests/test_api.py passing: 401 without key, 413 for 3 MB, ingest adds nodes

## Phase B3: Path finder, alerts on canvas, cases page (B, 14 September)

- [ ] PathFinder highlights the shortest path
- [ ] Alert click highlights its entities
- [ ] Cases list and detail with narrative highlighting from spans

## Phase B4: Ingest page (B, 14 September evening)

- [ ] Drag-drop upload for FIR text, CDR CSV, transactions CSV with API key header
- [ ] Result summary and link to the network with new nodes highlighted

## Phase 4: Integration and demo (both, 15 September)

- [ ] main merged, seed run, demo script walked end to end twice offline
- [ ] Live-upload FIR pre-cached
- [ ] Backup screen video recorded

## Phase 5: Neo4j AuraDB Free persistence (A) and timeline plus map (B), 16 to 18 September

- [ ] A: AuraDB instance, store writes with MERGE, metrics from Neo4j load, Cypher for lookup, ego and path
- [ ] B: timeline view, map view

## Phase 6: Cloud deployment (A) and hosted frontend (B), 19 to 20 September

- [ ] A: deploy/modal_app.py live, secrets and volume configured, credit budget documented
- [ ] A: optional one hour Azure Foundry model attempt recorded in the decisions log
- [ ] B: Vercel project live with custom domain, VITE_API_URL set
- [ ] Teammate runs the full demo from the link with nothing installed

## Phase 7: Custom extraction model (A) and engine comparison UI (B), 21 to 25 September

- [ ] A: model/prepare_data.py, training data spot-checked
- [ ] A: model/train.ipynb run on Kaggle, F1 table in repo, weights on Hugging Face Hub
- [ ] A: model/serve.py on Modal, EXTRACTION_ENGINE=custom works end to end
- [ ] B: engine selector, side-by-side comparison, evaluation table

## Phase 8: More sources and entity resolution, 26 to 28 September

- [ ] A: PDF, surveillance, social media, enriched criminal history ingest
- [ ] A: rapidfuzz matching with duplicate suggestions
- [ ] B: ingest UI for new sources, duplicate review screen

## Phase 9: Advanced pattern detection, 29 September to 1 October

- [ ] A: co_location, incident_proximity, Isolation Forest scores, explanations
- [ ] B: alerts center with evidence drill-down and charts

## Phase 10: Investigator tools, 2 to 4 October

- [ ] A: natural-language query to constrained JSON, report export
- [ ] B: query bar with result subgraph, report builder

## Phase 11: Security and audit, 5 to 7 October

- [ ] A: JWT with Argon2, roles, rate limiting, masking, hash-chained audit log with verify
- [ ] B: login, role-gated routes, masked fields, audit viewer

## Phase 12: Hardening and delivery, 8 to 10 October

- [ ] Tests, pip-audit and bun audit clean, GitHub Actions CI, Sentry, Playwright smoke test
- [ ] Docker Compose, README, final demo video

## Phase 13 (stretch): Blockchain anchoring, 11 October onward

- [ ] A: EvidenceRegistry contract, web3 anchoring of audit hashes
- [ ] B: transaction hash and verify on chain in the audit viewer

## Blockers

None.

## Decisions log

- 2026-09-12: Stack is Python 3.12 FastAPI plus React TypeScript. NetworkX for the MVP, Neo4j AuraDB Free in the full project.
- 2026-09-12: Extraction is regex plus a free hosted LLM through one OpenAI-compatible client with a disk cache. Gemini Flash primary, Cerebras secondary, Groq backup, Bytez optional.
- 2026-09-12: A fine-tuned GLiNER model is a full-project second engine, trained on Kaggle and hosted on Modal. It never runs on a laptop.
- 2026-09-12: Hosting is Vercel, Modal, AuraDB Free, Kaggle, Hugging Face Hub, all without a card. Render and a Hugging Face ZeroGPU Gradio Space are fallbacks. Hugging Face Docker Spaces now need PRO, so they are not the primary host.
- 2026-09-12: Bun replaces npm and npx. Vite stays for dev server and build.
- 2026-09-12: Student Pack use: Azure for Students (backup hosting, try-once Foundry model), Codespaces, free domain, Sentry, Actions minutes. Heroku and DigitalOcean skipped because they need a card. GitHub Models retired 30 July 2026.
- 2026-09-12: Person A owns backend, AI and deployment. Person B owns frontend.
- 2026-09-12: Hash-chained audit log in Phase 11, real chain anchoring only as the last stretch phase.
- 2026-09-12: The X-API-Key on mutating endpoints is an MVP guard only. JWT with roles replaces it in Phase 11.
