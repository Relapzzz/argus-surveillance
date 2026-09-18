from itertools import combinations
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.graph.store import Neo4jStore, Store, to_response
from app.main import app

pytestmark = pytest.mark.skipif(not settings.neo4j_uri, reason="NEO4J_URI not set")

GRAPH_PATH = settings.data_dir / "graph.json"
PERSON = "person:dinesh deshmukh"
SOURCE = "phone:9774964990"
TARGET = "person:aslam khan"
CASE = "case:FIR-2026-0001"
PAIR = ("person:swapnil joshi", "person:aslam khan")
URLS = {
    "stats": "/api/stats",
    "graph": "/api/graph",
    "key_players": "/api/analytics/key-players",
    "communities": "/api/analytics/communities",
    "alerts": "/api/analytics/alerts",
    "cases": "/api/cases",
    "case": f"/api/cases/{quote(CASE)}",
    "entity": f"/api/entities/{quote(PERSON)}",
    "ego": f"/api/entities/{quote(PERSON)}/ego?depth=2",
    "path": f"/api/analytics/path?source={quote(SOURCE)}&target={quote(TARGET)}",
}


@pytest.fixture(scope="module")
def seeded():
    store = Neo4jStore()
    store.load(GRAPH_PATH)
    yield store
    store.close()


@pytest.fixture(scope="module")
def pulled(seeded):
    store = Neo4jStore()
    store.pull()
    yield store
    store.close()


@pytest.fixture(scope="module")
def reference():
    store = Store()
    store.load(GRAPH_PATH)
    return store


def keyed(response):
    return {n.id: n.model_dump() for n in response.nodes}, {e.id: e.model_dump() for e in response.edges}


def by_id(rows, key="id"):
    return {row[key]: row for row in rows}


def keyed_json(payload):
    return {n["id"]: n for n in payload["nodes"]}, {e["id"]: e for e in payload["edges"]}


def case_free(reference, source, target) -> bool:
    route = reference.path(source, target)
    return route is not None and not any(id.startswith("case:") for id in route.node_ids)


def fallback_pair(seeded, reference):
    ids = dict.fromkeys(span.id for span in seeded.cases[CASE].entities if span.type != "case")
    return next((pair for pair in combinations(ids, 2) if case_free(reference, *pair)), None)


def fetch(client, store):
    app.state.store = store
    return {name: client.get(url).json() for name, url in URLS.items()}


def test_pull_reproduces_the_seed(pulled, reference):
    assert keyed(to_response(pulled.graph)) == keyed(to_response(reference.graph))
    assert pulled.cases == reference.cases
    assert {a.id: a for a in pulled.alerts} == {a.id: a for a in reference.alerts}


def test_entity_matches_networkx(seeded, reference):
    detail, expected = seeded.entity(PERSON), reference.entity(PERSON)
    assert detail.entity == expected.entity
    assert detail.metrics == expected.metrics
    assert {n.id for n in detail.neighbors} == {n.id for n in expected.neighbors}
    assert seeded.entity("person:nobody") is None


@pytest.mark.parametrize("depth", [1, 2])
def test_ego_matches_networkx(seeded, reference, depth):
    response, expected = seeded.ego(PERSON, depth), reference.ego(PERSON, depth)
    assert {n.id for n in response.nodes} == {n.id for n in expected.nodes}
    assert {e.id for e in response.edges} == {e.id for e in expected.edges}
    assert seeded.ego("person:nobody") is None


def test_path_matches_networkx(seeded, reference):
    route, expected = seeded.path(SOURCE, TARGET), reference.path(SOURCE, TARGET)
    assert len(route.node_ids) == len(expected.node_ids)
    assert route.node_ids[0] == SOURCE and route.node_ids[-1] == TARGET


def test_path_avoids_case_nodes(seeded, reference):
    pair = PAIR if case_free(reference, *PAIR) else fallback_pair(seeded, reference)
    if pair is None:
        pytest.skip("no case-free pair among the entities of one case")
    route, expected = seeded.path(*pair), reference.path(*pair)
    assert len(route.node_ids) == len(expected.node_ids)
    assert not any(id.startswith("case:") for id in route.node_ids)


def test_endpoints_match_json_store(pulled, reference):
    client = TestClient(app)
    expected = fetch(client, reference)
    live = fetch(client, pulled)
    app.state.store = reference
    for name in ("stats", "case"):
        assert live[name] == expected[name]
    for name in ("alerts", "cases"):
        assert by_id(live[name]) == by_id(expected[name])
    assert by_id(live["key_players"], "entity_id") == by_id(expected["key_players"], "entity_id")
    assert keyed_json(live["graph"]) == keyed_json(expected["graph"])
    assert keyed_json(live["ego"]) == keyed_json(expected["ego"])
    assert [{**c, "member_ids": set(c["member_ids"])} for c in live["communities"]] == [
        {**c, "member_ids": set(c["member_ids"])} for c in expected["communities"]
    ]
    assert {(n["id"], n["edge_id"]) for n in live["entity"]["neighbors"]} == {
        (n["id"], n["edge_id"]) for n in expected["entity"]["neighbors"]
    }
    assert {k: v for k, v in live["entity"].items() if k != "neighbors"} == {
        k: v for k, v in expected["entity"].items() if k != "neighbors"
    }
    assert len(live["path"]["node_ids"]) == len(expected["path"]["node_ids"])
    assert not any(id.startswith("case:") for id in live["path"]["node_ids"])


def test_reset_empties_and_load_seeds_again(seeded):
    seeded.reset()
    empty = Neo4jStore()
    empty.pull()
    assert empty.graph.number_of_nodes() == 0 and empty.cases == {} and empty.alerts == []
    empty.close()
    seeded.load(GRAPH_PATH)
    again = Neo4jStore()
    again.pull()
    assert again.graph.number_of_nodes() == seeded.graph.number_of_nodes()
    assert again.graph.number_of_edges() == seeded.graph.number_of_edges()
    again.close()
