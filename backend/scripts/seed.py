import sys
import time
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.extract import llm
from app.graph.analytics import communities, key_players
from app.graph.store import Neo4jStore, Store
from app.ingest.cdr import ingest_cdr
from app.ingest.fir import ingest_fir
from app.ingest.persons import ingest_persons
from app.ingest.transactions import ingest_transactions

SEED_DIR = settings.data_dir / "seed"
GRAPH_PATH = settings.data_dir / "graph.json"
PAUSE = 8 if "groq" in settings.llm_base_url else 0


def main() -> None:
    store = Store()
    persons = ingest_persons(SEED_DIR / "persons.csv")
    store.merge(persons.entities, persons.relationships)
    for path in sorted((SEED_DIR / "fir").glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        cached = llm.cache_path(text).exists()
        result = ingest_fir(text)
        store.merge(result.entities, result.relationships)
        store.cases[result.case.id] = result.case
        print(f"{result.case.id}: {len(result.entities)} entities, {len(result.relationships)} relationships")
        if PAUSE and not cached:
            time.sleep(PAUSE)
    for name, ingest in (("cdr.csv", ingest_cdr), ("transactions.csv", ingest_transactions)):
        result = ingest(SEED_DIR / name)
        store.merge(result.entities, result.relationships)
    store.recompute()
    store.save(GRAPH_PATH)
    G = store.graph
    print(f"{G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(store.cases)} cases, {len(store.alerts)} alerts -> {GRAPH_PATH}")
    if settings.graph_store == "neo4j":
        db = Neo4jStore()
        db.load(GRAPH_PATH)
        db.close()
        print(f"{G.number_of_nodes()} nodes, {G.number_of_edges()} edges -> Neo4j")
    for c in communities(G):
        print(f"community {c.id}: {c.size} members, top {c.top_member}")
    everyone = key_players(G, limit=G.number_of_nodes())
    for p in everyone[:10]:
        print(f"{p.score:.3f} {p.label}: degree {p.degree}, betweenness {p.betweenness:.3f}, pagerank {p.pagerank:.4f}, {p.reason}")
    bridge = max(everyone, key=lambda p: p.betweenness)
    print(f"highest betweenness among persons: {bridge.label} ({bridge.betweenness:.3f})")
    print("alerts:", dict(Counter(a.type for a in store.alerts)))


if __name__ == "__main__":
    main()
