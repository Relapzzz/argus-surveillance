# VYUHA

Smart India Hackathon 2026 project for the National Crime Records Bureau. It reads FIRs, call records and bank transactions, extracts people, phones, vehicles, places and organizations, links them into a network, ranks the key players, flags suspicious patterns and shows it all on an interactive graph.

All data in this repository is synthetic.

## Why this approach

The problem is not a shortage of data. A district already holds the FIRs, the call detail records and the bank statements an investigation needs; they sit in different systems, in different shapes, and nobody reads them together. So the design starts from one decision: every record, whatever its source, becomes the same thing, a set of entities and the relationships between them, keyed by identifiers that are the same in every system.

**A graph, not a table or a search index.** A relational database answers "which cases name Aslam Khan". It struggles with "who connects these two groups", which is a question about paths, and paths are what an investigation is. In a graph the intermediary is found by betweenness centrality, a standard measure that needs no training data and no labels, and the shortest route from a complainant's phone to a gang leader is one query. Keyword search over the FIRs cannot find Dinesh Deshmukh at all, because no FIR names him; the graph finds him because the call records and the bank statements do.

**Deterministic identifiers instead of a matching model.** A phone number, an account number or a vehicle plate is already a unique identifier, and a name normalised to lower case with collapsed whitespace is enough to join a FIR to a criminal history row from the same district. Every ingest module builds ids the same way (phone:9876543210, person:vikram singh), so a phone seen in a FIR, a CDR and a persons file becomes one node without any matching logic, and every new file adds to the same picture. Fuzzy matching arrives in Phase 8 for what this does not cover, such as spelling variants, as suggestions an investigator confirms rather than automatic merges.

**Regex plus a hosted language model for extraction, not a model trained from scratch.** Phone numbers, plates, FIR numbers, law sections, amounts and dates have fixed formats and are extracted by regular expressions, which are exact, free and instant. Names, roles, localities and the relationships between them need reading, and a hosted language model does that with no training data, which matters for a problem where real FIRs are not public. The prompt asks for a fixed JSON schema and the code keeps only strings that occur in the source text, so the model cannot invent an entity or follow an instruction hidden inside a document. The client speaks the OpenAI protocol, so Gemini, Groq and NVIDIA are interchangeable by configuration, and every response is cached on disk, so the demo runs with no key and no network. A fine-tuned GLiNER model follows in Phase 7 as a second engine behind the same interface, for the day the data cannot leave the building.

**Rules with evidence before anomaly models.** The four alerts in the MVP (a burst of calls, structured deposits under the reporting threshold, a bridge between groups, a phone that only talks at night) are rules that quote their evidence: the amounts, the week, the hours, the counts. An investigator can check every one against the records, and a court can be told exactly why a person was flagged. Unsupervised scores, such as the Isolation Forest planned for Phase 9, are added as a second layer on top of explainable rules, never as the only signal.

**Metrics on actors, not on raw records.** Every person absorbs the phones, accounts and vehicles they own before centrality is computed, and shared localities are left out. Without that projection a person's importance is measured by the hop to their own phone, and every gang leader looks like a bridge because two FIRs share a locality. The projection is what makes the intermediary rank first on betweenness with only five connections.

**In memory first, a graph database when it is needed.** NetworkX holds the whole graph in memory and computes degree, betweenness, PageRank, Louvain communities, paths and ego networks in under a second for a district-sized dataset, with no server to install. Persistence sits behind one module, so Neo4j AuraDB replaces the JSON file without touching the API, and the same deterministic ids become the MERGE keys in the database.

**Free hosted tiers, no cards.** Every service in the stack (Gemini, Groq and NVIDIA Build for extraction, Modal for the API, Vercel for the frontend, AuraDB Free for the graph, Kaggle and Hugging Face for the model) has a free tier that needs no payment card, and the code never depends on any single one of them. That is what lets a student team build and demonstrate the full pipeline, and what lets a police unit run it on ordinary infrastructure.

### Compared with the alternatives

| Approach | What it does well | Where it falls short for this problem |
|---|---|---|
| Manual analysis with spreadsheets and case files | Nothing to deploy, and investigators trust it | Days per case, no view across stations, and an intermediary never named in a FIR stays invisible |
| Relational database with joins | Mature and exact | Every cross-source question is a new join, and multi-hop questions such as "who connects these two groups" need recursive queries that grow with each hop |
| Full-text search or a chat interface over the documents | Fast to build and easy to ask | Only finds what a document says; cannot rank influence, find groups or trace a route through call and bank records |
| Commercial link analysis suites | Rich visual tooling | Licence cost per seat, closed formats, and extraction from Indian FIR text is not built in |
| A named-entity model trained from scratch | Runs offline | Needs thousands of labelled FIRs that do not exist publicly, and months of annotation before a first result |
| Pure anomaly detection over calls and transactions | Finds unusual behaviour without rules | Scores without reasons; an investigator cannot act on a number and a court cannot use it |
| This system | One graph across sources, explainable alerts, ranked key players, automatic extraction, live ingest | Extraction depends on a hosted model until the Phase 7 engine ships, and entity resolution is exact-match until Phase 8 |

**What makes it efficient.** Ingest is linear in the size of the file. Extraction runs once per document and is cached, so rebuilding the seed graph from 40 FIRs takes four seconds. Recompute over the 225-node seed graph takes a fraction of a second; betweenness, the slowest metric, handles a district's records in seconds and NetworkX offers a sampled approximation for larger graphs. The API holds nothing that is not in the database once Neo4j is configured, so it scales by adding instances. And there is no data-entry step: an investigator drops a file and the network updates.

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

## The case in the demo dataset

Everything below is synthetic and was generated with a fixed seed, but it is built the way a real investigation looks: 40 FIRs from nine Pune police stations between June and August 2026, about 3,000 call detail records and 800 bank transfers. Read separately, the FIRs are eight extortion cases, eight assaults, eight thefts, eight drug seizures and eight cyber frauds. Read together, they describe two gangs and the man who connects them.

The Warje gang, shown on the board as the Swargate group because groups are named after where most of their people live. Aslam Khan alias Chotu runs it from Swargate and drives the car MH 14 JX 0154 that appears in several complaints. His lieutenants are Ramesh More alias Baba and Kiran Desai alias Dada, both from Warje. Nine members do the street work: Sachin Patil, Vaibhav Sawant, Salman Khan, Prakash Jadhav, Ramesh Kulkarni, Sunil Thorat, Deepak Shinde, Ajay Deshmukh and Vaibhav Patil. Their extortion and assault cases cluster around Warje, Kothrud and Swargate.

The Kondhwa group, shown on the board as the Camp group. Vijay Desai alias Vicky leads it from Kondhwa with eight members: Rohit Kamble, Javed Ansari, Imran Shaikh, Tanveer Sayyed, Sanjay Jadhav, Santosh Kadam, Ravindra Chavan and Irfan Shaikh. Sanjay Jadhav is the most frequently named accused in the whole corpus, with nine FIRs. Their cases sit around Kondhwa, Hadapsar and Camp, and include the drug seizures and cyber frauds.

No FIR names members of both gangs. An investigator reading the register would see two unrelated sets of cases. The system finds what links them:

- The go-between. Dinesh Deshmukh alias Mama of Kondhwa is never named in any FIR. He exists only in the criminal history file, the call records and the bank statements. His phone 6318699938 talks to Aslam Khan, Kiran Desai, Vijay Desai and Rohit Kamble. His account 3487401640052 received Rs 1,47,274 from Aslam Khan's account and Rs 2,43,863 from Vijay Desai's account. With only five connections he is the only route between the two groups, which is why he has the highest betweenness score of anyone and why the bridge alert points at him.
- The money. Three mule accounts each collect eight or nine transfers of Rs 40,000 to Rs 49,999 inside a week, every one under the Rs 50,000 reporting threshold, then forward the whole sum. Two of them (Rs 4,07,743 on 12 June and Rs 3,91,880 on 12 July) pay into Aslam Khan's account 13389083863. The third (Rs 3,55,315 on 10 August) pays into Vijay Desai's account 1834738299737. Both gangs launder money the same way.
- The burner phone. FIR-2026-0001 mentions phone 8210470952 as linked to Ramesh More. The call records show all 15 of its calls fall between midnight and 4 am on the nights before incidents, to Aslam Khan, Deepak Shinde, Salman Khan and Prakash Jadhav.
- The call burst. Prakash Jadhav and Salman Khan exchanged 10 calls between 19:02 and 19:52 on 6 July 2026, the evening before an incident.
- The complainant's trail. Swapnil Joshi reported in FIR-2026-0001 that Ramesh More, Vaibhav Sawant and Aslam Khan stopped him in Shivajinagar and demanded Rs 4,40,000. His phone 9774964990 reaches Aslam Khan in three hops through the phones of Ajay Deshmukh and Aslam Khan himself, because the extortion calls are in the call records.

The live upload closes the story. backend/data/demo/FIR-2026-0041.txt is a new complaint from Swargate in which Kiran Desai of the Warje gang and Imran Shaikh of the Kondhwa group extort a shopkeeper together. It is the first document to name both gangs. After the upload the two of them rank as bridges beside Dinesh Deshmukh, and the network shows the gangs working as one.

## Presenting the demo

The seed network is committed, so the demo needs no network access and no LLM key. Open the Guide from the header: each step below is one of its tasks, and every page also has the Hindi line an officer expects.

1. Overview. Read the finding aloud: 40 FIRs from nine stations become 225 linked people, phones, accounts and places, two groups that never share an FIR, and one man whose phone talks to both. The strip underneath shows how the picture was built, in the order the records were read.
2. See who connects the groups. The board lights Dinesh Deshmukh in red between the two group areas while everything else fades, and the inspector says he is the only route between them and is not named in any FIR. Open full profile shows his phone, account, address, his associates on both sides and the money that moved through him, and prints as one sheet.
3. Trace a complainant's phone to a leader. The route from 97749 64990 to Aslam Khan is drawn as the red string: three hops from a complaint to the head of a group.
4. Follow the money. The Alerts page, filtered to structuring, reads each mule account in plain words: nine transfers just under Rs 50,000 in a week, then the whole sum moved on to the leader's account.
5. See when they talked. The timeline of Dinesh Deshmukh shows his calls to both groups on their own lanes with the money squares between them; click a mark to read that day.
6. See where it happened. The map shows the FIR places, homes and cell towers of Pune; follow one person to see only their places.
7. Read an FIR. FIR-2026-0001 opens as the sheet it was written on, with every extracted entity highlighted; click a name to open the profile.
8. Add a new FIR. Upload backend/data/demo/FIR-2026-0041.txt: four new entities appear and the key people now include Kiran Desai and Imran Shaikh as bridges.
9. Restore the demo records from the same page before the next run.

## Using it for a new case

The demo dataset is only a starting point. On the Add records page, Start a new investigation empties the workspace. Add the FIRs of the new case as text files, then the call detail records and bank statements as CSV files in the formats shown on the page. Entities with the same phone number, account number, plate or name are matched automatically, so each file adds to the same picture. The Overview rewrites itself from whatever records are present, and the demo dataset can be restored at any time.

By default the workspace lives in memory and is lost when the backend restarts. To keep it, create a free Neo4j AuraDB instance (no card needed), paste the credentials file it offers for download into backend/.env as it is, add GRAPH_STORE=neo4j, and run the seed script once so the demo dataset is loaded into the database:

```
cd backend
uv run python scripts/seed.py
```

From then on every upload is saved, Restore the demo dataset rewrites the database with the committed seed, and Start a new investigation empties it. Leave GRAPH_STORE=json for local work without a database.

## Project files

- IMPLEMENTATION_PLAN.md: phased plan for Person A (backend) and Person B (frontend).
- TASKS.md: current status.
