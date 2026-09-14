import networkx as nx
import pytest
from conftest import GANGS, graph_of

from app.config import settings
from app.graph import analytics
from app.graph.store import Store

CHAIN = [
    ("person:x", "person:y", "co_accused"),
    ("person:y", "person:z", "associate_of"),
    ("person:z", "vehicle:MH12AB1234", "owns"),
    ("person:x", "case:FIR-2026-0001", "mentioned_in"),
    ("vehicle:MH12AB1234", "case:FIR-2026-0001", "mentioned_in"),
    ("person:lonely", "phone:9800000000", "owns"),
]


@pytest.fixture(scope="module")
def gangs() -> nx.Graph:
    return graph_of(GANGS).graph


@pytest.fixture(scope="module")
def seed() -> Store:
    store = Store()
    store.load(settings.data_dir / "graph.json")
    return store


def metric(G: nx.Graph, id: str, name: str):
    return G.nodes[id]["metrics"][name]


def test_compute_metrics_writes_every_metric(gangs):
    for id, data in gangs.nodes(data=True):
        assert set(data["metrics"]) == {"degree", "betweenness", "pagerank", "community"}
        assert data["metrics"]["degree"] == gangs.degree(id)
    assert sum(metric(gangs, n, "pagerank") for n in gangs) == pytest.approx(1)
    assert max(gangs, key=lambda n: metric(gangs, n, "betweenness")) == "person:m"
    assert {metric(gangs, n, "community") for n in gangs} == {0, 1}
    assert metric(gangs, "person:a0", "community") != metric(gangs, "person:b0", "community")


def test_key_players_rank_persons_by_score_with_reasons(gangs):
    players = analytics.key_players(gangs, limit=5)
    assert len(players) == 5
    assert [p.score for p in players] == sorted((p.score for p in players), reverse=True)
    assert all(0 <= p.score <= 1 for p in players)
    by_id = {p.entity_id: p for p in players}
    assert set(list(by_id)[:3]) == {"person:a0", "person:b0", "person:m"}
    assert by_id["person:m"].reason == "bridges communities 0 and 1"
    assert by_id["person:a0"].reason == f"most connected in community {metric(gangs, 'person:a0', 'community')}"
    member = players[3]
    assert member.reason == f"high influence in community {member.community}"
    assert (by_id["person:m"].degree, by_id["person:m"].betweenness) == (2, metric(gangs, "person:m", "betweenness"))
    assert len(analytics.key_players(gangs, limit=100)) == 21


def test_communities_cover_every_node(gangs):
    groups = analytics.communities(gangs)
    assert [c.id for c in groups] == [0, 1]
    assert [c.size for c in groups] == [11, 10]
    assert all(c.top_member in c.member_ids and c.size == len(c.member_ids) for c in groups)


def test_shortest_path_skips_cases_unless_one_is_an_endpoint():
    G = graph_of(CHAIN).graph
    path = analytics.shortest_path(G, "person:x", "vehicle:MH12AB1234")
    assert path.node_ids == ["person:x", "person:y", "person:z", "vehicle:MH12AB1234"]
    assert path.edge_ids == ["person:x|person:y", "person:y|person:z", "person:z|vehicle:MH12AB1234"]
    assert analytics.shortest_path(G, "person:x", "case:FIR-2026-0001").node_ids == ["person:x", "case:FIR-2026-0001"]
    assert analytics.shortest_path(G, "case:FIR-2026-0001", "vehicle:MH12AB1234").edge_ids == ["case:FIR-2026-0001|vehicle:MH12AB1234"]
    with pytest.raises(nx.NetworkXNoPath):
        analytics.shortest_path(G, "person:x", "person:lonely")
    with pytest.raises(nx.NodeNotFound):
        analytics.shortest_path(G, "person:nobody", "person:x")


def test_ego_expands_by_depth(gangs):
    assert set(analytics.ego(gangs, "person:m", 1)) == {"person:m", "person:a0", "person:b0"}
    assert analytics.ego(gangs, "person:m", 2).number_of_nodes() == 21


def test_seed_key_players_surface_kingpin_and_intermediary(seed):
    top = analytics.key_players(seed.graph, limit=3)
    assert "person:aslam khan" in {p.entity_id for p in top}
    bridge = max(analytics.key_players(seed.graph, limit=100), key=lambda p: p.betweenness)
    assert bridge.entity_id == "person:dinesh deshmukh"
    assert bridge.reason.startswith("bridges communities")


def test_seed_alerts_cover_every_type(seed):
    by_type: dict[str, list] = {}
    for alert in seed.alerts:
        by_type.setdefault(alert.type, []).append(alert)
    assert set(by_type) == {"burst_calls", "structuring", "bridge_node", "night_calls"}
    assert {a.entity_ids[0] for a in by_type["structuring"]} == {"account:13983735403", "account:173936385467", "account:4458771753556"}
    assert [a.entity_ids[0] for a in by_type["night_calls"]] == ["phone:8210470952"]
    bridge = by_type["bridge_node"]
    assert [a.entity_ids[0] for a in bridge] == ["person:dinesh deshmukh"]
    assert {"phone:6318699938", "account:3487401640052", "person:aslam khan", "person:vijay desai"} <= set(bridge[0].entity_ids)


ACTORS = [
    ("person:p", "phone:1", "owns"),
    ("person:p", "account:9", "owns"),
    ("phone:1", "phone:2", "called"),
    ("phone:1", "phone:3", "called"),
    ("account:9", "account:8", "transacted"),
    ("person:p", "location:kothrud", "resides_at"),
    ("phone:2", "location:kothrud", "seen_at"),
    ("location:kothrud", "case:FIR-2026-0001", "mentioned_in"),
    ("person:q", "case:FIR-2026-0001", "mentioned_in"),
]


def test_metrics_belong_to_actors_and_leave_locations_out():
    G = graph_of(ACTORS).graph
    p, phone, account = (G.nodes[n]["metrics"] for n in ("person:p", "phone:1", "account:9"))
    assert phone == p and account == p
    assert p["degree"] == 3 and p["betweenness"] > 0
    assert G.nodes["location:kothrud"]["metrics"] == {"degree": 3, "betweenness": 0, "pagerank": 0, "community": p["community"]}
    assert G.nodes["person:q"]["metrics"]["degree"] == 1
    assert G.nodes["person:q"]["metrics"]["community"] != p["community"]
