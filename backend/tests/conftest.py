from itertools import combinations

import pytest

from app.config import settings
from app.graph.store import Store
from app.ingest import edge_id
from app.schemas import Entity, Relationship


@pytest.fixture(scope="session", autouse=True)
def json_store() -> None:
    settings.graph_store = "json"


def clique(type: str, ids: list[str], edge_type: str) -> list[tuple[str, str, str]]:
    return [(f"{type}:{a}", f"{type}:{b}", edge_type) for a, b in combinations(ids, 2)]


def graph_of(edges: list[tuple[str, str, str]]) -> Store:
    store = Store()
    ids = dict.fromkeys(n for a, b, _ in edges for n in (a, b))
    entities = [Entity(id=n, type=n.split(":")[0], label=n.split(":", 1)[1]) for n in ids]
    relationships = [Relationship(id=edge_id(a, b), source=a, target=b, type=t) for a, b, t in edges]
    store.merge(entities, relationships)
    store.recompute()
    return store


GANGS = (
    clique("person", [f"a{i}" for i in range(10)], "co_accused")
    + clique("person", [f"b{i}" for i in range(10)], "co_accused")
    + [("person:m", "person:a0", "associate_of"), ("person:m", "person:b0", "associate_of")]
)
