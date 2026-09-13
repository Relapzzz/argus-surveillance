import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
ENTITY_TYPES = {"person", "phone", "vehicle", "location", "organization", "account", "case"}
EDGE_TYPES = {"called", "transacted", "co_accused", "owns", "resides_at", "seen_at", "member_of", "mentioned_in", "associate_of"}
METRICS = {"degree", "betweenness", "pagerank", "community"}


def graph(**params):
    return client.get("/api/graph", params=params).json()


def test_stats_counts_every_entity_type():
    stats = client.get("/api/stats").json()
    assert set(stats["entities"]) == ENTITY_TYPES
    assert sum(stats["entities"].values()) == len(graph()["nodes"])
    assert stats["relationships"] == len(graph()["edges"])
    assert stats["cases"] == len(client.get("/api/cases").json())
    assert stats["alerts"] == len(client.get("/api/analytics/alerts").json())


def test_graph_nodes_carry_metrics_and_edges_join_known_nodes():
    g = graph()
    ids = {n["id"] for n in g["nodes"]}
    assert {n["type"] for n in g["nodes"]} == ENTITY_TYPES
    assert all(set(n["metrics"]) == METRICS for n in g["nodes"])
    assert {e["type"] for e in g["edges"]} == EDGE_TYPES
    assert all(e["source"] in ids and e["target"] in ids for e in g["edges"])


def test_graph_filters_by_types():
    g = graph(types="person,phone")
    ids = {n["id"] for n in g["nodes"]}
    assert {n["type"] for n in g["nodes"]} == {"person", "phone"}
    assert all(e["source"] in ids and e["target"] in ids for e in g["edges"])


def test_graph_filters_by_community_and_min_degree():
    g = graph(community=0, min_degree=3)
    assert g["nodes"]
    assert all(n["metrics"]["community"] == 0 and n["metrics"]["degree"] >= 3 for n in g["nodes"])


def test_entity_detail_lists_neighbors_and_sources():
    node = graph()["nodes"][0]
    detail = client.get(f"/api/entities/{node['id']}").json()
    assert detail["entity"]["id"] == node["id"]
    assert set(detail["metrics"]) == METRICS
    assert len(detail["neighbors"]) == node["metrics"]["degree"]
    assert detail["sources"] == node["sources"]


def test_unknown_entity_is_404():
    assert client.get("/api/entities/person:nobody").status_code == 404


def test_ego_subgraph_is_the_node_and_its_neighbors():
    node = graph()["nodes"][0]
    ego = client.get(f"/api/entities/{node['id']}/ego", params={"depth": 1}).json()
    detail = client.get(f"/api/entities/{node['id']}").json()
    assert {n["id"] for n in ego["nodes"]} == {node["id"], *(n["id"] for n in detail["neighbors"])}


def test_key_players_are_persons_ranked_by_score():
    players = client.get("/api/analytics/key-players", params={"limit": 3}).json()
    assert len(players) == 3
    assert all(p["entity_id"].startswith("person:") and p["reason"] for p in players)
    assert [p["score"] for p in players] == sorted((p["score"] for p in players), reverse=True)


def test_communities_partition_the_graph():
    communities = client.get("/api/analytics/communities").json()
    assert sum(c["size"] for c in communities) == len(graph()["nodes"])
    assert all(c["top_member"] in c["member_ids"] for c in communities)


def test_alerts_have_valid_type_and_severity():
    alerts = client.get("/api/analytics/alerts").json()
    assert alerts
    assert all(a["type"] in {"burst_calls", "structuring", "bridge_node", "night_calls"} for a in alerts)
    assert all(a["severity"] in {"low", "medium", "high"} and a["entity_ids"] for a in alerts)


def test_path_between_connected_nodes():
    edges = graph()["edges"]
    first = edges[0]
    second = next(e for e in edges if first["target"] in (e["source"], e["target"]) and e["id"] != first["id"])
    far = second["source"] if second["target"] == first["target"] else second["target"]
    path = client.get("/api/analytics/path", params={"source": first["source"], "target": far}).json()
    assert path["node_ids"][0] == first["source"] and path["node_ids"][-1] == far
    assert len(path["edge_ids"]) == len(path["node_ids"]) - 1


def test_path_with_unknown_node_is_404():
    assert client.get("/api/analytics/path", params={"source": "person:nobody", "target": "person:nobody"}).status_code == 404


def test_cases_list_and_detail_spans_point_into_the_narrative():
    cases = client.get("/api/cases").json()
    assert cases and {"id", "fir_number", "station", "incident_time", "sections", "entity_count"} <= set(cases[0])
    case = client.get(f"/api/cases/{cases[0]['id']}").json()
    assert case["entities"]
    assert all(0 <= e["start"] < e["end"] <= len(case["narrative"]) for e in case["entities"])
    assert cases[0]["entity_count"] == len({e["id"] for e in case["entities"]})


@pytest.mark.parametrize("path", ["/ingest/fir", "/ingest/cdr", "/ingest/transactions", "/admin/reset"])
def test_post_endpoints_are_not_implemented(path):
    assert client.post(f"/api{path}").status_code == 501
