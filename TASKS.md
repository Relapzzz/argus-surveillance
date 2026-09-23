# TASKS

Current phase: Phase 5 complete on 18 September, including the frontend rework and its timeline and map; next is Phase 6 cloud deployment and hosted frontend from 19 September
Person B left the team on 18 September; Person A owns the frontend as well
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
- [x] B: frontend scaffold with Bun, Vite, Tailwind v4, shadcn/ui, react-router, TanStack Query, react-force-graph-2d
- [x] B: app shell with sidebar navigation and dark theme, four empty pages
- [x] B: src/api/client.ts typed against the contract, fixture fallback, .env.example
- [x] Both: Phase 0 verify commands pass (A passed on 13 September, B passed on 14 September)

## Phase A1: Synthetic dataset (A, 13 September morning)

- [x] scripts/generate_dataset.py with fixed seed
- [x] data/seed/fir/*.txt (about 40), cdr.csv, transactions.csv, persons.csv
- [x] Planted structure verified: intermediary, burner phone, structuring accounts

## Phase A2: Regex extractors (A, 13 September)

- [x] app/extract/regex.py
- [x] tests/test_regex.py passing

## Phase B1: Graph canvas (B, 13 September)

- [x] GraphCanvas renders the fixture with color by type and size by pagerank
- [x] GraphFilters by type and community, search focuses a node
- [x] Node click selects and zooms

## Phase A3: LLM extraction and FIR ingest (A, 13 September afternoon)

- [x] app/config.py, app/schemas.py Extraction
- [x] app/extract/llm.py with cache, app/extract/engine.py
- [x] app/ingest/fir.py
- [x] scripts/seed.py warms the cache for every seed FIR, cache committed
- [x] Injection test FIR yields no injected entity

## Phase B2: Dashboard and entity panel (B, 13 September afternoon)

- [x] Dashboard stat cards, KeyPlayersTable, AlertsList
- [x] EntityPanel drawer with attributes, metrics, neighbors, sources, focus and expand

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

- [x] PathFinder highlights the shortest path
- [x] Alert click highlights its entities
- [x] Cases list and detail with narrative highlighting from spans

## Phase B4: Ingest page (B, 14 September evening)

- [x] Drag-drop upload for FIR text, CDR CSV, transactions CSV with API key header
- [x] Result summary and link to the network with new nodes highlighted (verified against the real API on 14 September: upload adds 8 entities, reset restores 225 nodes)

## Phase 4: Integration and demo (both, 15 September)

- [x] main merged, seed run, demo script walked end to end twice offline (14 September: twice through the browser, plus the upload, route and reset routes through the FastAPI TestClient with LLM_API_KEY wrong and LLM_BASE_URL unreachable)
- [x] Live-upload FIR pre-cached: backend/data/demo/FIR-2026-0041.txt, cache file committed
- [x] Backup screen video recorded (teammate task; the demo steps are in README.md)
- [x] Frontend redesigned by Person A and the network hover bug fixed, see the 14 September decisions
- [x] README updated, v0.1-mvp tagged

## Phase 5: Neo4j AuraDB Free persistence (A) and timeline plus map (B), 16 to 18 September

- [x] A: AuraDB instance, store writes with MERGE, metrics from Neo4j load, Cypher for lookup, ego and path
- [x] A: timeline view, map view, delivered inside the frontend rework of 18 September with Overview, Profile, Alerts, Guide and the light case board

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
- Demo upload: backend/data/demo/FIR-2026-0041.txt names Kiran Desai (Gang A) and Imran Shaikh (Gang B) as co-accused with a new complainant, phone and vehicle. It adds 4 entities and 11 relationships, after which Kiran Desai and Imran Shaikh rank as bridges beside Dinesh Deshmukh and the bridge_node alert still fires. Its LLM response is cached, so the upload needs no key. Reset from the Add records page or restart the backend afterwards.
- Before running the Playwright suite stop any dev server on 5173, otherwise playwright.config.ts reuses it against the live backend instead of fixture mode.
- backend/.env holds the AuraDB credentials pasted from Aura's file plus GRAPH_STORE=json; set GRAPH_STORE=neo4j to run the API against AuraDB (the backend launch config reads .env). The database holds the committed seed. Any uv run pytest with NEO4J_URI set rewrites it with the seed.
- AuraDB Free is deleted after 30 days without activity; reload with GRAPH_STORE=neo4j uv run python scripts/seed.py.

Frontend follow-ups for later phases, all on the new pages:

- Phase 6: Vercel builds frontend/ as it is; set VITE_API_URL, VITE_API_KEY and, for the hosted map, VITE_MAP_TILES with a CARTO key if OpenStreetMap volume becomes a problem.
- Phase 7: the engine selector belongs on the Add records page beside the FIR upload; the comparison view is a new page; the evaluation table goes on the Overview under the pipeline strip.
- Phase 8: new drop zones join the Add records page; the duplicate review screen is a new page linked from the upload result.
- Phase 9: per-pair call volume charts go on the Alerts page under each alert and reuse the timeline lanes.
- Phase 10: the query bar sits in the Network header beside search; the report builder collects from Profile and Alerts and reuses the print stylesheet.
- Phase 11: login lives in the header where the Guide button is; masking applies on Profile and in Search; the audit viewer is a new page.

Notes for the frontend:

- The frontend was rebuilt on 18 September as a light case board; read the 18 September decisions before changing src/components/GraphCanvas.tsx, src/index.css or src/styles.css. tests/e2e/frontend.spec.ts has 7 tests that run in fixture mode against the seed graph; stop any dev server on 5173 first.
- Hindi strings live in src/lib/vocab.ts and need a teammate's review.
- Frontend setup: copy frontend/.env.example to frontend/.env, set VITE_API_URL=http://localhost:8000 and VITE_API_KEY to the backend key, keep VITE_USE_FIXTURE=false against the real backend. bun install --frozen-lockfile, bun run dev.
- Open review items from the merge: a tautological assertion in src/api/fixture.test.ts and the missing ESLint config.

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
- 2026-09-14: Person B delivered Phase 0, B1, B2, B3 and B4 in one commit on the frontend branch. It was merged into main with --allow-unrelated-histories, keeping main's TASKS.md and IMPLEMENTATION_PLAN.md and adding frontend/ and AGENTS.md (Person B's tool guidance, no secrets). Build, six vitest tests and three of four Playwright tests pass; every page was verified in the browser against the Phase A5 backend.
- 2026-09-14: Before merging, Person A fixed two Important review findings in src/pages/Network.tsx: selecting an entity no longer resets the type and community filters (they are cleared only when the selected entity is hidden by them) and no longer creates new filter state, so the graph memo, the canvas data and the force layout keep their positions on every click, path and alert. playwright.config.ts now probes http://127.0.0.1:5173, the host vite binds, and reuses a running server outside CI. Fourteen Minor review findings stay with Person B, among them a tautological assertion in src/api/fixture.test.ts, Phase A5 wording in user-facing copy and the missing ESLint config.
- 2026-09-14: The frontend uses the cn package (shadcn's clsx plus tailwind-merge replacement) and imports shadcn/tailwind.css from the shadcn package, so both are runtime dependencies on purpose.
- 2026-09-14: Network hover bug root cause: force-graph 1.51 pauses canvas repaints once the force engine stops (autoPauseRedraw) and a hover only fires the callback, so labels drawn in nodeCanvasObject appeared only while the layout was still moving. Fix: autoPauseRedraw false (60 fps measured with 225 nodes) and the hovered id kept in a ref so hovering never re-renders React.
- 2026-09-14: GraphCanvas keeps node positions across filter and focus changes through a map of the live node objects that is written in an effect, never inside useMemo: StrictMode invokes memo callbacks twice, the map held discarded clones without coordinates, and centring on a selection silently did nothing.
- 2026-09-14: Frontend design system: Archivo Variable with its width axis for headings and IBM Plex Mono for identifiers, timestamps and metrics; tokens in src/index.css feed the shadcn primitives; dark only; amber for selection, routes, primary actions and severities; persons paper-white, cases drawn as squares. Geist and the unused shadcn sheet, card, badge, table, input and select files were removed.
- 2026-09-14: The Network page is a workbench: the canvas fills the viewport, the legend doubles as the type filter, a select filters by group, nodes colour by type or group, group areas are padded convex hulls of each community's actor nodes, the top persons are labelled with greedy de-overlap and every node from zoom 2.2, selections, alert highlights and routes dim everything else, and a traced route carries particles. The inspector column with Entity, Route and Alerts tabs replaces the modal Sheet, so clicking around the canvas never closes anything. One EntitySearch combobox serves the header and both route pickers.
- 2026-09-14: Briefing replaces Dashboard: a summary sentence built from stats, communities and the bridge_node alert (its person fetched by id), a ledger of entity counts, key players with group chips, leads that phrase each alert type as an investigative question with its rule, and group cards. UI vocabulary is group for community, FIR for case and Place for location; humanize() rewrites community in API reasons and alert text.
- 2026-09-14: The Cases page renders the narrative as a paper sheet in IBM Plex Mono with paperPalette for the highlights, because the paper-white person colour of the dark palette vanished on paper. The Ingest page explains extract, resolve and recompute, and uploadWithGraphDiff returns the added nodes so the result lists them as chips.
- 2026-09-14: The demo FIR lives in backend/data/demo, outside data/seed so seed.py ignores it. Running seed.py again reproduced graph.json except floating point noise in the last digits of betweenness and pagerank; the committed file was kept.
- 2026-09-14: Phase 4 verify ran the upload, path and reset routes through the FastAPI TestClient with LLM_API_KEY=wrong-key and LLM_BASE_URL=http://127.0.0.1:9/v1; everything came from the cache. The backup video stays open for the teammate.
- 2026-09-14: POST /admin/clear empties the in-memory workspace (nodes 0, edges 0) so a new investigation starts from its own records; the Add records page offers Start a new investigation and Restore the demo dataset behind one confirmation dialog, and Briefing, Network and Case files show plain-language empty states that point to Add records. README.md now tells the story of the seeded case for presenters and explains the new-case flow. The workspace stays in memory until Phase 5.
- 2026-09-18: AGENTS.md was removed from the repository and added to .gitignore; README gained a "Why this approach" section with the alternatives table.
- 2026-09-18: Persistence: Neo4jStore(Store) in app/graph/store.py, selected by GRAPH_STORE=neo4j, keeps the NetworkX replica that analytics run on; pull() reads the database at startup and push() writes the whole workspace after every recompute (MERGE on the deterministic ids, label Entity plus a label from the type, upper-case relationship types, attributes as JSON strings, CaseRecord and Alert nodes holding the model JSON); reset() also runs DETACH DELETE and load(path) wipes then pushes, which is what seed.py and POST /admin/reset use. entity, ego and path run as Cypher on the Neo4j store (one query with collect, one parameterised hop per depth, shortestPath with case nodes skipped unless they are endpoints); routers call store.entity, store.ego and store.path. Dynamic labels need Neo4j 5.26 or later. The replica is per process, so GRAPH_STORE=neo4j runs one worker.
- 2026-09-18: Settings ignores extra .env keys and uses Aura's variable names NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD and NEO4J_DATABASE, so the credentials file Aura offers for download is pasted into backend/.env unchanged. GRAPH_STORE=json stays the default, tests force it through a session fixture, and tests/test_neo4j.py runs only when NEO4J_URI is set.
- 2026-09-18: The AuraDB Free instance (200K nodes, 400K relationships, deleted after 30 days idle) was created during the session and seeded with 225 nodes and 1820 edges. The neo4j+s connection worked on the Norton laptop without truststore. Every GET endpoint returns the same data from both stores (tests/test_neo4j.py::test_endpoints_match_json_store); shortest routes may differ among equal-length alternatives.
- 2026-09-18: Phase 5 verify: uv run pytest 160 passed including the 8 live Neo4j tests, GRAPH_STORE=neo4j seed.py loaded 225 nodes and 1820 edges into AuraDB, and the API started against AuraDB returned the same /api/stats as the JSON store (verifier, 18 September). Running seed.py again rewrote graph.json with floating point noise only and the committed file was kept.
- 2026-09-18: Person B left the team; Person A owns the frontend. The frontend was rebuilt as a light case board (branch b/phase-5, phases F0 to F7 of that day's plan): paper surfaces, navy ink, khaki file chrome and one red string for routes, selection and highlights; Anek Latin Variable for display and Mukta for text and the Hindi lines, both from Fontsource; no monospace, identifiers use tabular figures and Indian formats from src/lib/format.ts; navigation, page titles and primary buttons carry a Hindi line from src/lib/vocab.ts. Tailwind v4 and the shadcn base-nova primitives stay; every visible style is hand-written CSS on the tokens in src/index.css, with src/styles.css for the shell and shared pieces and one stylesheet beside each page.
- 2026-09-18: Pages are Overview (the finding as a sentence, the pipeline strip, Start with, People who matter, Leads, Groups as folders, ledger), Network (URL state entity, highlight, tab, from and to; the canvas fits every highlighted entity when an alert or route lights several), Profile at /entity/:id (why this matters from src/lib/why.ts, identifiers, FIRs, associates, activity, print stylesheet), Timeline (swimlanes from src/lib/timeline.ts), Map (react-leaflet 5, CircleMarkers, OpenStreetMap tiles muted by a CSS filter, URL from VITE_MAP_TILES because CARTO raster tiles now need a key), Case files (register plus the FIR sheet with a ruled header block; narrative highlights open profiles), Alerts (filters in the URL, evidence sentences from src/lib/alerts.ts), Add records. The Guide drawer derives its tasks from live data (src/lib/guide.ts) and the header search finds entities and FIR numbers.
- 2026-09-18: Groups are named after the locality where most of their people live (groupNames in src/lib/graph.ts): the Warje gang appears as the Swargate group and the Kondhwa group as the Camp group; humanize() rewrites API reasons with those names and turns Rs into the rupee sign. README uses the same names.
- 2026-09-18: Backend support for time and place: app/places.py holds the tower table and locality coordinates (the generator imports it), called edges carry a cells list parallel to timestamps, location nodes carry lat and lon; graph.json was regenerated (225 nodes, 1820 edges) and AuraDB reloaded. The frontend fixture is now a copy of the seed graph.json; the fixture module skips FIR nodes on routes and ranks key players with the API's percentile composite, so fixture mode phrases the go-between like the API.
- 2026-09-18: Two cascade lessons: unlayered element resets in styles.css beat Tailwind utilities, so the button and link resets sit in @layer base; buttonVariants() merges its classes through cn so link-styled outline buttons keep their border.
- 2026-09-18: Review fixes before the merge: the Overview only claims that groups never share an FIR when no FIR names people from two groups, and describes the go-between as the person every route between the groups runs through; CDR uploads without a tower_location column are accepted with blank cells; owner maps, the address matcher and the list joiner live once in src/lib; dead styles from the old pages were removed. Route endpoints traced by hand are not written back to the URL yet.
- 2026-09-18: Verify: uv run pytest 165 passed; bun run test 44 passed; bun run build clean; bun run test:e2e 7 passed in fixture mode; the demo walked in the browser against the live backend, including the FIR-2026-0041 upload (4 entities, 11 relationships) and the restore back to 225 and 1820.
- 2026-09-23: The project is renamed from ARGUS to VYUHA (Sanskrit for a battle formation), in capitals everywhere to match the idea deck. The pushpin logo is replaced by a Chakravyuha mark: two broken rings of associates in ink with the kingpin as a red node at the centre (Logo in Shell.tsx, favicon.svg on a paper tile so it reads on dark tabs). The wordmark carries व्यूह underneath like the bilingual tabs. The GitHub repository keeps the name argus-surveillance. Verify: uv run pytest 165 passed; bun run test 44 passed; bun run build clean; bun run test:e2e 7 passed.
