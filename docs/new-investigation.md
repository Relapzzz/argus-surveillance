# Using VYUHA for a new case

The demo dataset is only a starting point. On the Add records page, Start a new investigation empties the workspace. Add the FIRs of the new case as text files, then the call detail records and bank statements as CSV files in the formats shown on the page. Entities with the same phone number, account number, plate or name are matched automatically, so each file adds to the same picture. The Overview rewrites itself from whatever records are present, and the demo dataset can be restored at any time.

By default the workspace lives in memory and is lost when the backend restarts. To keep it, create a free Neo4j AuraDB instance (no card needed), paste the credentials file it offers for download into backend/.env as it is, add GRAPH_STORE=neo4j, and run the seed script once so the demo dataset is loaded into the database:

```
cd backend
uv run python scripts/seed.py
```

From then on every upload is saved, Restore the demo dataset rewrites the database with the committed seed, and Start a new investigation empties it. Leave GRAPH_STORE=json for local work without a database.
