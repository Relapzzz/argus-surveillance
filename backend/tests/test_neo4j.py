from itertools import combinations

import pytest

from app.config import settings
from app.graph.store import Neo4jStore, Store, to_response

pytestmark = pytest.mark.skipif(not settings.neo4j_uri, reason="NEO4J_URI not set")

GRAPH_PATH = settings.data_dir / "graph.json"
PERSON = "person:dinesh deshmukh"
SOURCE = "phone:9774964990"
TARGET = "person:aslam khan"


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
    case = next(iter(seeded.cases.values()))
    ids = [span.id for span in case.entities if span.type != "case"]
    source, target = next((a, b) for a, b in combinations(ids, 2) if reference.path(a, b))
    route = seeded.path(source, target)
    assert not any(id.startswith("case:") for id in route.node_ids)


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
