from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.extract import llm
from app.main import app

ENTITY_TYPES = {"person", "phone", "vehicle", "location", "organization", "account", "case"}
EDGE_TYPES = {"called", "transacted", "co_accused", "owns", "resides_at", "seen_at", "member_of", "mentioned_in", "associate_of"}
METRICS = {"degree", "betweenness", "pagerank", "community"}
KEY = {"X-API-Key": "test-key"}
INJECTION_FIR = Path(__file__).resolve().parent / "fixtures" / "injection_fir.txt"
BIG = "x" * (3 * 1024 * 1024)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as client:
        yield client


@pytest.fixture(autouse=True)
def api_key(monkeypatch):
    monkeypatch.setattr(settings, "api_key", "test-key")


@pytest.fixture
def offline(monkeypatch):
    monkeypatch.setattr(llm, "_create", lambda text: pytest.fail("network call during ingest"))


@pytest.fixture
def restored(client):
    yield
    assert client.post("/api/admin/reset", headers=KEY).status_code == 200


def graph(client, **params):
    return client.get("/api/graph", params=params).json()


def test_stats_counts_every_entity_type(client):
    stats = client.get("/api/stats").json()
    assert set(stats["entities"]) == ENTITY_TYPES
    assert sum(stats["entities"].values()) == len(graph(client)["nodes"])
    assert stats["relationships"] == len(graph(client)["edges"])
    assert stats["cases"] == len(client.get("/api/cases").json())
    assert stats["alerts"] == len(client.get("/api/analytics/alerts").json())


def test_graph_nodes_carry_metrics_and_edges_join_known_nodes(client):
    g = graph(client)
    ids = {n["id"] for n in g["nodes"]}
    assert {n["type"] for n in g["nodes"]} == ENTITY_TYPES
    assert all(set(n["metrics"]) == METRICS for n in g["nodes"])
    assert g["edges"] and {e["type"] for e in g["edges"]} <= EDGE_TYPES
    assert all(e["source"] in ids and e["target"] in ids for e in g["edges"])


def test_graph_filters_by_types(client):
    g = graph(client, types="person,phone")
    ids = {n["id"] for n in g["nodes"]}
    assert {n["type"] for n in g["nodes"]} == {"person", "phone"}
    assert all(e["source"] in ids and e["target"] in ids for e in g["edges"])


def test_graph_filters_by_community_and_min_degree(client):
    g = graph(client, community=0, min_degree=3)
    assert g["nodes"]
    assert all(n["metrics"]["community"] == 0 and n["metrics"]["degree"] >= 3 for n in g["nodes"])


def test_entity_detail_lists_neighbors_and_sources(client):
    g = graph(client)
    node = g["nodes"][0]
    detail = client.get(f"/api/entities/{node['id']}").json()
    incident = {e["source"] if e["target"] == node["id"] else e["target"] for e in g["edges"] if node["id"] in (e["source"], e["target"])}
    assert detail["entity"]["id"] == node["id"]
    assert set(detail["metrics"]) == METRICS
    assert {n["id"] for n in detail["neighbors"]} == incident
    assert all(n["relationship"] in EDGE_TYPES for n in detail["neighbors"])
    assert detail["sources"] == node["sources"]


def test_unknown_entity_is_404(client):
    assert client.get("/api/entities/person:nobody").status_code == 404


def test_ego_subgraph_is_the_node_and_its_neighbors(client):
    node = graph(client)["nodes"][0]
    ego = client.get(f"/api/entities/{node['id']}/ego", params={"depth": 1}).json()
    detail = client.get(f"/api/entities/{node['id']}").json()
    assert {n["id"] for n in ego["nodes"]} == {node["id"], *(n["id"] for n in detail["neighbors"])}


def test_unknown_entity_ego_is_404(client):
    assert client.get("/api/entities/person:nobody/ego").status_code == 404


def test_key_players_are_persons_ranked_by_score(client):
    players = client.get("/api/analytics/key-players", params={"limit": 3}).json()
    assert len(players) == 3
    assert all(p["entity_id"].startswith("person:") and p["reason"] for p in players)
    assert [p["score"] for p in players] == sorted((p["score"] for p in players), reverse=True)


def test_communities_partition_the_graph(client):
    communities = client.get("/api/analytics/communities").json()
    assert sum(c["size"] for c in communities) == len(graph(client)["nodes"])
    assert all(c["top_member"] in c["member_ids"] for c in communities)


def test_alerts_have_valid_type_and_severity(client):
    alerts = client.get("/api/analytics/alerts").json()
    assert alerts
    assert all(a["type"] in {"burst_calls", "structuring", "bridge_node", "night_calls"} for a in alerts)
    assert all(a["severity"] in {"low", "medium", "high"} and a["entity_ids"] for a in alerts)


def test_path_from_a_complainant_phone_to_the_top_key_player(client):
    target = client.get("/api/analytics/key-players", params={"limit": 1}).json()[0]["entity_id"]
    for summary in client.get("/api/cases").json():
        case = client.get(f"/api/cases/{summary['id']}").json()
        source = next((s["id"] for s in case["entities"] if s["type"] == "phone"), None)
        if source is None:
            continue
        response = client.get("/api/analytics/path", params={"source": source, "target": target})
        if response.status_code == 200:
            break
    path = response.json()
    assert path["node_ids"][0] == source and path["node_ids"][-1] == target
    assert len(path["edge_ids"]) == len(path["node_ids"]) - 1
    assert not any(id.startswith("case:") for id in path["node_ids"][1:-1])


def test_path_with_unknown_node_is_404(client):
    assert client.get("/api/analytics/path", params={"source": "person:nobody", "target": "person:nobody"}).status_code == 404


def test_cases_list_and_detail_spans_point_into_the_narrative(client):
    cases = client.get("/api/cases").json()
    assert cases and {"id", "fir_number", "station", "incident_time", "sections", "entity_count"} == set(cases[0])
    case = client.get(f"/api/cases/{cases[0]['id']}").json()
    assert case["entities"]
    assert all(0 <= e["start"] < e["end"] <= len(case["narrative"]) for e in case["entities"])
    assert cases[0]["entity_count"] == len({e["id"] for e in case["entities"]})


def test_unknown_case_is_404(client):
    assert client.get("/api/cases/case:FIR-1999-0001").status_code == 404


@pytest.mark.parametrize("path", ["/ingest/fir", "/ingest/cdr", "/ingest/transactions", "/admin/reset"])
@pytest.mark.parametrize("headers", [{}, {"X-API-Key": "wrong-key"}])
def test_mutations_need_the_api_key(client, path, headers):
    assert client.post(f"/api{path}", headers=headers).status_code == 401


def test_non_ascii_key_is_401(client):
    assert client.post("/api/ingest/cdr", headers=[(b"x-api-key", b"k\xc3\xa9y")]).status_code == 401


def test_oversized_csv_is_413(client):
    csv = b"caller,callee,start_time,duration_sec,tower_id,tower_location\n" + BIG.encode()
    assert client.post("/api/ingest/cdr", headers=KEY, files={"file": ("cdr.csv", csv)}).status_code == 413


def test_oversized_upload_is_413(client):
    response = client.post("/api/ingest/fir", headers=KEY, files={"file": ("big.txt", BIG.encode())})
    assert response.status_code == 413


def test_oversized_json_body_is_413(client):
    assert client.post("/api/ingest/fir", headers=KEY, json={"text": BIG}).status_code == 413


def test_json_body_without_text_is_422(client):
    assert client.post("/api/ingest/fir", headers=KEY, json={"narrative": "x"}).status_code == 422


def test_multipart_without_a_file_field_is_422(client):
    assert client.post("/api/ingest/fir", headers=KEY, files={"other": ("a.txt", b"x")}).status_code == 422


def test_unsupported_extension_is_415(client):
    assert client.post("/api/ingest/fir", headers=KEY, files={"file": ("report.pdf", b"x")}).status_code == 415
    assert client.post("/api/ingest/cdr", headers=KEY, files={"file": ("calls.txt", b"x")}).status_code == 415


def test_csv_missing_a_column_is_422(client):
    csv = b"caller,callee\n9000000001,9000000002\n"
    assert client.post("/api/ingest/cdr", headers=KEY, files={"file": ("cdr.csv", csv)}).status_code == 422


def test_fir_upload_adds_nodes_and_ignores_injected_entities(client, offline, restored):
    text = INJECTION_FIR.read_text(encoding="utf-8")
    result = client.post("/api/ingest/fir", headers=KEY, files={"file": ("fir.txt", text.encode())}).json()
    assert result["case_id"] == "case:FIR-2026-0099"
    assert result["entities_added"] >= 1
    assert result["case_id"] in {c["id"] for c in client.get("/api/cases").json()}
    labels = {n["label"].lower() for n in graph(client)["nodes"]}
    assert "person:ganesh pawar" in {n["id"] for n in graph(client)["nodes"]}
    assert "admin user" not in labels
    case = client.get(f"/api/cases/{result['case_id']}").json()
    assert "admin user" not in {s["label"].lower() for s in case["entities"]}
    again = client.post("/api/ingest/fir", headers=KEY, json={"text": text}).json()
    assert again["case_id"] == result["case_id"]
    assert again["entities_added"] == 0


def test_fir_upload_with_a_bom_and_crlf_uses_the_cached_narrative(client, offline, restored):
    data = "﻿".encode() + INJECTION_FIR.read_text(encoding="utf-8").replace("\n", "\r\n").encode()
    result = client.post("/api/ingest/fir", headers=KEY, files={"file": ("fir.txt", data)}).json()
    assert result["case_id"] == "case:FIR-2026-0099"
    narrative = client.get("/api/cases/case:FIR-2026-0099").json()["narrative"]
    assert "\r" not in narrative
    assert not narrative.startswith("﻿")


def test_cdr_upload_links_two_new_phones(client, restored):
    csv = b"caller,callee,start_time,duration_sec,tower_id,tower_location\n"
    csv += b"9000000001,9000000002,2026-07-01T10:00:00,60,T01,Kothrud\n"
    csv += b"9000000002,9000000001,2026-07-01T10:30:00,30,T01,Kothrud\n"
    result = client.post("/api/ingest/cdr", headers=KEY, files={"file": ("cdr.csv", csv)}).json()
    assert (result["entities_added"], result["relationships_added"]) == (2, 1)
    detail = client.get("/api/entities/phone:9000000001").json()
    assert [n["id"] for n in detail["neighbors"]] == ["phone:9000000002"]


def test_transactions_upload_links_two_new_accounts(client, restored):
    csv = b"txn_id,from_account,to_account,amount,timestamp,mode\n"
    csv += b"T1,7000000001,7000000002,45000,2026-07-01T10:00:00,IMPS\n"
    csv += b"T2,7000000001,7000000002,46000,2026-07-02T10:00:00,IMPS\n"
    result = client.post("/api/ingest/transactions", headers=KEY, files={"file": ("txn.csv", csv)}).json()
    assert (result["entities_added"], result["relationships_added"]) == (2, 1)
    detail = client.get("/api/entities/account:7000000001").json()
    assert [n["id"] for n in detail["neighbors"]] == ["account:7000000002"]


def test_reset_restores_the_seed_graph(client):
    before = client.get("/api/stats").json()
    csv = b"caller,callee,start_time,duration_sec,tower_id,tower_location\n9000000001,9000000002,2026-07-01T10:00:00,60,T01,Kothrud\n"
    client.post("/api/ingest/cdr", headers=KEY, files={"file": ("cdr.csv", csv)})
    assert client.post("/api/admin/reset", headers=KEY).json() == {"nodes": 225, "edges": 1820}
    assert client.get("/api/stats").json() == before
