# TASKS

Current phase, Person A: Phase 4 integration once B's phases land; Phase 0 manual items still open, see Blockers
Current phase, Person B: Phase 0
MVP demo: 15 September 2026
Full project: about 12 October 2026

Update this file before ending every session. Tick items, move the current phase pointer, add blockers, log decisions.

## Phase 0: Setup (both, 12 September)

- [x] A: git init, GitHub repo created (https://github.com/Relapzzz/argus-surveillance)
- [x] A: B added as collaborator, secret scanning and Dependabot enabled in repository settings
- [x] A: backend/data/fixture_graph.json written and pushed to main
- [x] A: backend scaffold with uv, stub API serving the fixture on every GET endpoint, 17 API tests
- [x] A: .env.example written
- [x] A: LLM keys confirmed with GET /models; backend/.env uses gemini-3.5-flash-lite, backend/.env.groq holds the Groq backup, backend/.env.nvidia the NVIDIA fallback
- [x] A: Azure for Students and GitHub Pro activated from the Student Pack
- [ ] B: frontend scaffold with Bun, Vite, Tailwind v4, shadcn/ui, react-router, TanStack Query, react-force-graph-2d
- [ ] B: app shell with sidebar navigation and dark theme, four empty pages
- [ ] B: src/api/client.ts typed against the contract, fixture fallback, .env.example
- [ ] Both: Phase 0 verify commands pass (A passed on 13 September, B pending)

## Phase A1: Synthetic dataset (A, 13 September morning)

- [x] scripts/generate_dataset.py with fixed seed
- [x] data/seed/fir/*.txt (about 40), cdr.csv, transactions.csv, persons.csv
- [x] Planted structure verified: intermediary, burner phone, structuring accounts

## Phase A2: Regex extractors (A, 13 September)

- [x] app/extract/regex.py
- [x] tests/test_regex.py passing

## Phase B1: Graph canvas (B, 13 September)

- [ ] GraphCanvas renders the fixture with color by type and size by pagerank
- [ ] GraphFilters by type and community, search focuses a node
- [ ] Node click selects and zooms

## Phase A3: LLM extraction and FIR ingest (A, 13 September afternoon)

- [x] app/config.py, app/schemas.py Extraction
- [x] app/extract/llm.py with cache, app/extract/engine.py
- [x] app/ingest/fir.py
- [x] scripts/seed.py warms the cache for every seed FIR, cache committed
- [x] Injection test FIR yields no injected entity

## Phase B2: Dashboard and entity panel (B, 13 September afternoon)

- [ ] Dashboard stat cards, KeyPlayersTable, AlertsList
- [ ] EntityPanel drawer with attributes, metrics, neighbors, sources, focus and expand

## Phase A4: Graph store, analytics, patterns, seed (A, 14 September)

- [x] app/graph/store.py, analytics.py, patterns.py
- [x] app/ingest/cdr.py, transactions.py, persons.py
- [x] scripts/seed.py builds data/graph.json in 4 seconds from the cache, committed
- [x] Key players lists kingpin and intermediary, alerts include structuring and night_calls (kingpin second by score; intermediary first by betweenness with degree 5 but 27th of 46 by composite score, so the demo reaches him through the bridge_node alert or the betweenness column)
- [x] tests passing (127)

## Phase A5: Real API (A, 14 September)

- [x] Routers over the store, stub removed
- [x] app/security.py API key, CORS from env, upload validation
- [x] tests/test_api.py passing: 401 without key, 413 for 3 MB, ingest adds nodes (146 tests in the suite, 36 in test_api.py)

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

Notes for Person A:

- Share API_KEY from backend/.env with B privately; it becomes VITE_API_KEY on the frontend.
- To switch the LLM provider, copy backend/.env.groq or backend/.env.nvidia over backend/.env. All three are gitignored; .env.nvidia carries LLM_EXTRA_BODY with thinking disabled, which Nemotron needs. Cached FIRs need no provider at all.
- Python HTTPS on this laptop fails certificate checks under Norton. The LLM client must call truststore.inject_into_ssl() before creating the OpenAI client; truststore is a dependency.
- On this laptop Norton intercepts TLS, so every uv command needs --system-certs (uv sync --system-certs, uv add --system-certs ...). Large installs can freeze the machine, so install one package at a time and never chain long commands.
- Tell B the real API is up: every GET serves data/graph.json, POST /ingest/fir, /ingest/cdr, /ingest/transactions and /admin/reset need X-API-Key, and uploads stay in memory until reset or restart.
- For Phase 4: pre-cache the live-upload FIR by uploading the file once through POST /ingest/fir with the key (or by calling ingest_fir on its text), then reset. Since A5 an uploaded file and the same file read from disk share one cache key, so either route works.

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
- 2026-09-13: Graph nodes carry metrics nested under metrics {degree, betweenness, pagerank, community}. Edge id is the two node ids sorted and joined with |. Edge weight is the number of observations of the pair, one per call, transfer or extracted relationship, so called and transacted weights equal count.
- 2026-09-13: scipy is a runtime dependency because networkx 3 delegates PageRank to it.
- 2026-09-13: The Phase 0 stub is app/stub.py. It loads data/fixture_graph.json at import and is deleted in Phase A5 when routers/ arrives.
- 2026-09-13: On the fixture, weighted Louvain put phones and accounts in their own communities away from their owners. Unweighted Louvain at resolution 0.5 gives the two gang communities. A4 settles weighting on the seed graph.
- 2026-09-13: Fixture alerts cover all four types so the alerts UI can show every kind. Severities follow the pattern rules: burst_calls and structuring high, bridge_node and night_calls medium.
- 2026-09-13: mentioned_in edges make a shared FIR the shortest link between any two of its entities. The stub returns that plain path; A4 skips case nodes in path search unless one is an endpoint.
- 2026-09-13: LLM primary is gemini-3.5-flash-lite: on the two fixture narratives it took 3 seconds, found all 13 entities with every role right, used 1.5k tokens and ignored an injected instruction. gemini-3.5-flash is the quality fallback on the same key, 10 seconds because it thinks. gemini-3.8-flash answered 503 high demand and is avoided for the demo, as are preview and latest aliases. Backup provider is Groq with qwen/qwen3.8-27b, 2 seconds, 8k tokens per minute limit. Cerebras answered HTTP 402 and is dropped.
- 2026-09-13: truststore is a dependency and the LLM client injects it into ssl before any request, because Norton intercepts TLS on Person A's laptop and certifi rejects its certificate.
- 2026-09-13: Commits carry no Co-Authored-By trailer or Claude attribution.
- 2026-09-13: Third provider is NVIDIA Build with nvidia/nemotron-3-super-120b-a12b and thinking disabled through chat_template_kwargs: 10 seconds, 13/13 entities, roles right, injection ignored. Gemma 4, DeepSeek V4 Flash and GLM 5.3 Flash timed out after 75 seconds on the free endpoint; Kimi, Llama Nemotron 70B and Mistral Large 2 are not enabled for the account. 40 requests per minute, fallback only.
- 2026-09-13: Mistral is rejected: its free mode returns 0 requests per minute on every Small, Medium and Magistral model for this account, and Ministral 14B, the only model that answers, follows injected instructions. Retest only if the Limits page in the Mistral admin panel shows those models unlocked.
- 2026-09-13: Phase branches are deleted once fast-forwarded into main; a/phase-0 is gone.
- 2026-09-13: Faker is dropped from the stack and removed from pyproject: its en_IN names, phone formats and addresses do not read as Pune. The generator draws names from curated Hindu Marathi and Muslim pools that are never mixed inside one name, addresses from a street-per-area map of the ten tower areas, and phones, accounts and plates from the seeded generator.
- 2026-09-13: Seed corpus rules: no seed FIR names members of both gangs, each civilian is tied to one gang, the intermediary is in persons.csv with phone and account and is never named in a FIR, the extortion calls the narratives describe appear in cdr.csv, one call burst is planted for the burst_calls alert, and the burner phone is attributed to a Gang A lieutenant only in FIR text.
- 2026-09-13: File FIR-2026-NNNN.txt carries "FIR No. NNNN/2026". cdr.csv carries tower_id T01 to T10 and the tower area name; tower coordinates stay in the generator for the Phase 5 map.
- 2026-09-13: Every narrative template carries its own sections; 351(2) or 351(3) appears only where the text threatens, 351(3) for death or grievous hurt. Drug FIRs have a police officer complainant with one fixed station and are registered at that station. Gang members and the intermediary have male names, civilians are complainants in at most two FIRs each, amounts are round figures.
- 2026-09-13: Regex extractors return distinct values in first-occurrence order. sections() returns (act, section) pairs with acts IPC, BNS, NDPS Act and IT Act, ignores the year after an act, and joins sections with commas, "and" and "r/w"; the corpus forms "8(c) r/w 22(b) NDPS Act 1985" and "66D IT Act 2000" are covered.
- 2026-09-13: fir_numbers() returns the canonical FIR-YYYY-NNNN form so ingest builds case ids directly. dates() returns naive datetimes, midnight when no time follows the date, and accepts "at about HH:MM hrs". A phone needs the literal +91 or a leading 0 before its 10 digits; a bare 11 to 16 digit run that no phone match consumed is an account.
- 2026-09-13: Known regex limits handed to Phase A3: find_spans must not be called with an empty label (it returns one empty span per position), word-scaled amounts such as "Rs. 5 lakh" and the word "hours" are not parsed, plates are matched upper-case only, and the time must directly follow the date. The LLM engine covers those.
- 2026-09-13: The LLM cache key is sha256(PROMPT_VERSION + narrative) without the model, so the committed cache serves every provider and the tests pass on a machine without .env. Clearing data/cache and running seed.py re-extracts with the active provider. LLM_EXTRA_BODY is a JSON object merged into every chat request; .env.nvidia carries the Nemotron thinking switch.
- 2026-09-13: The extraction prompt asks for names without honorifics or ranks so FIR persons resolve to persons.csv rows, gives a vehicle to the person travelling on it, and keeps locations at locality level such as Kothrud or Camp so residences and incident places become shared nodes for communities and the Phase 9 co-location rule. An unknown role becomes null, an unknown predicate drops the relationship, and evidence not copied from the narrative is blanked. On the corpus gemini-3.5-flash-lite took 2 minutes 49 seconds for 40 FIRs and found 44 persons, of which all 20 accused match persons.csv, 16 localities, 70 phones and 33 vehicles, every vehicle with an owner.
- 2026-09-13: find_spans allows spaces and hyphens between the label's characters so plates and phones written with spaces are highlighted. Case spans are non-overlapping, longest label first, sorted by start.
- 2026-09-13: ingest_fir returns FirIngest {case, entities, relationships}. The case node carries fir_number, station, incident_time, sections and amounts; the narrative and spans stay in the Case record like the fixture's cases list. incident_time is the earliest date in the text and null when absent. A person node carries aliases and role and its mentioned_in edge repeats the role. One edge per pair within a FIR: a second type goes to attributes.types and weight stays 1 for the store to increment across sources. A text without a FIR number gets the id FIR-UPLOAD- plus eight hex characters of its sha256.
- 2026-09-13: scripts/seed.py puts backend/ on sys.path so the documented uv run python scripts/seed.py works, and pauses 8 seconds after each uncached FIR when Groq is the provider.
- 2026-09-14: Metrics are computed on the actor projection: persons absorb the phones, accounts and vehicles they own, locations stay out, and every node reports its actor's metrics (a location keeps its own degree, zero betweenness and pagerank, and the community of most of its neighbours). On the raw seed graph the intermediary ranked 23rd of 46 persons by betweenness, every gang leader had a cross-gang route through shared localities such as Kondhwa and Swargate, and Louvain split the graph into an FIR cluster, phone cliques and account clusters. On the actor graph the intermediary is the only cross-gang route, Louvain at resolution 0.5 gives the two gangs plus two background account clusters, and the bridge_node alert fires on him alone.
- 2026-09-14: The generator's intermediary now calls the kingpin, one Gang A lieutenant, the Gang B leader, one Gang B member and one background phone. With one contact per gang the leaders were unique gateways to him and out-scored him on betweenness (0.605 against 0.503). cdr.csv and transactions.csv were regenerated; FIR files, the LLM cache and persons.csv are byte-identical.
- 2026-09-14: graph.json holds {nodes, edges, cases, alerts} in the API's own shapes, the same top level as fixture_graph.json, because node_link_data overwrites source and target with NetworkX's endpoint order and owns edges need their direction. Called edges carry a sorted timestamps list, transacted edges a transfers list of {amount, ts, to}. On a repeated pair the store increments weight, unions types and sources and keeps existing attribute values, so re-uploading the same CSV is not a supported flow.
- 2026-09-14: Key player percentiles are the share of persons with a strictly smaller value, so ties at zero betweenness score zero; the bridges reason needs a percentile of at least 0.95 and therefore 20 or more persons. The composite score ranks the gang leaders first; the intermediary tops betweenness but sits 27th of 46 by score.
- 2026-09-14: structuring alerts report forwarded_to, the largest outgoing transfer after the window starts, so each mule alert links to the leader's account. bridge_node entity_ids list the actor, its identifiers and its actor neighbours. CSV ingests cap reads at 20,000 rows through MAX_ROWS in app/ingest.
- 2026-09-14: tests/conftest.py holds graph_of(edges) and the GANGS fixture shared by the analytics and pattern tests; tests/test_store.py covers the store and the CSV ingests, and two tests assert the demo claims on the committed graph.json.
- 2026-09-14: Uploads stay in memory in the MVP. The API never writes data/graph.json; it loads it at startup in a lifespan and POST /admin/reset reloads it, so the committed seed survives every demo run and a restart is a reset. Neo4j makes uploads persistent in Phase 5. Store access goes through get_store in app/routers/__init__.py; app/stub.py is deleted.
- 2026-09-14: Mutating endpoints answer 401 when the X-API-Key header is missing or wrong and also when API_KEY is empty, so an unconfigured server fails closed. The key is compared as bytes with secrets.compare_digest because Starlette decodes headers as latin-1 and a non-ASCII value made the str comparison raise. The check runs before any upload body is read: the ingest routes take the raw Request and parse the form inside the handler, and a Content-Length above 2 MB answers 413 before parsing.
- 2026-09-14: Upload status codes: 413 above 2 MB (2 * 1024 * 1024 bytes, also enforced on the bytes read for chunked bodies), 415 for an extension other than .txt or .csv, 422 when pandas cannot parse the CSV (cdr.py and transactions.py read with usecols so a missing column raises) or the JSON body has no text. /ingest/fir accepts multipart or JSON {text} on one route by branching on Content-Type, so OpenAPI shows no body schema for it.
- 2026-09-14: ingest_fir normalises CRLF to LF and the router decodes FIR uploads with utf-8-sig, because the Windows checkout has CRLF files and an upload of the cached injection fixture through the API produced a different LLM cache key and a real LLM call during the A5 live check. The stray cache file was deleted.
- 2026-09-14: Deferred from the A5 review: running ingest_fir and recompute in a threadpool (the demo is single-user and the live FIR is cached) and an openapi_extra body schema for /ingest/fir.
