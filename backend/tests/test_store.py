import io
from datetime import datetime

from conftest import GANGS, graph_of

from app.graph.store import Store, to_response
from app.ingest import edge_id
from app.ingest.cdr import ingest_cdr
from app.ingest.persons import ingest_persons
from app.ingest.transactions import ingest_transactions
from app.schemas import Case, Entity, Relationship

CDR = """caller,callee,start_time,duration_sec,tower_id,tower_location
9800000001,9800000002,2026-07-02T11:00:00+05:30,60,T01,Kothrud
9800000002,9800000001,2026-07-01T10:00:00+05:30,60,T01,Kothrud
9800000001,9800000003,2026-06-30T09:00:00+05:30,60,T02,Warje
"""
TXN = """txn_id,from_account,to_account,amount,timestamp,mode
TXN1,22222222222,11111111111,5000,2026-07-03T10:00:00+05:30,UPI
TXN2,11111111111,22222222222,45000,2026-07-01T10:00:00+05:30,IMPS
TXN3,11111111111,33333333333,1000,2026-07-02T10:00:00+05:30,NEFT
"""
PERSONS = """name,alias,phone,account,address,prior_case_count
Aslam Khan,Chotu,9800000001,11111111111,"H.No. 33, Satara Road, Swargate, Pune",8
Sachin Patil,,,,"H.No. 795, Atul Nagar, Warje, Pune",1
"""


def test_cdr_groups_calls_per_pair():
    result = ingest_cdr(io.StringIO(CDR))
    assert [e.id for e in result.entities] == ["phone:9800000001", "phone:9800000002", "phone:9800000003"]
    assert all(e.type == "phone" and e.label == e.id[6:] for e in result.entities)
    edges = {e.id: e for e in result.relationships}
    pair = edges["phone:9800000001|phone:9800000002"]
    assert (pair.source, pair.target, pair.type, pair.weight) == ("phone:9800000001", "phone:9800000002", "called", 2)
    stamps = ["2026-07-01T10:00:00+05:30", "2026-07-02T11:00:00+05:30"]
    assert pair.attributes == {"count": 2, "first_seen": stamps[0], "last_seen": stamps[1], "timestamps": stamps}
    assert edges["phone:9800000001|phone:9800000003"].weight == 1


def test_transactions_keep_direction_per_transfer():
    result = ingest_transactions(io.StringIO(TXN))
    assert {e.id for e in result.entities} == {"account:11111111111", "account:22222222222", "account:33333333333"}
    pair = {e.id: e for e in result.relationships}["account:11111111111|account:22222222222"]
    assert (pair.source, pair.target, pair.type, pair.weight) == ("account:22222222222", "account:11111111111", "transacted", 2)
    assert pair.attributes == {
        "count": 2,
        "total_amount": 50000,
        "first_seen": "2026-07-01T10:00:00+05:30",
        "last_seen": "2026-07-03T10:00:00+05:30",
        "transfers": [
            {"amount": 45000, "ts": "2026-07-01T10:00:00+05:30", "to": "account:22222222222"},
            {"amount": 5000, "ts": "2026-07-03T10:00:00+05:30", "to": "account:11111111111"},
        ],
    }


def test_persons_own_phone_and_account():
    result = ingest_persons(io.StringIO(PERSONS))
    entities = {e.id: e for e in result.entities}
    assert set(entities) == {"person:aslam khan", "person:sachin patil", "phone:9800000001", "account:11111111111"}
    aslam = entities["person:aslam khan"]
    assert aslam.label == "Aslam Khan"
    assert aslam.attributes == {"aliases": ["Chotu"], "address": "H.No. 33, Satara Road, Swargate, Pune", "prior_case_count": 8}
    assert entities["person:sachin patil"].attributes["aliases"] == []
    assert {(r.source, r.target, r.type) for r in result.relationships} == {
        ("person:aslam khan", "phone:9800000001", "owns"),
        ("person:aslam khan", "account:11111111111", "owns"),
    }


def test_merge_dedupes_nodes_and_stacks_edge_types():
    store = Store()
    a = Entity(id="person:a", type="person", label="A", attributes={"role": "accused"}, sources=["case:1"])
    b = Entity(id="person:b", type="person", label="B", sources=["case:1"])
    edge = Relationship(id="person:a|person:b", source="person:a", target="person:b", type="co_accused", sources=["case:1"])
    assert store.merge([a, b], [edge]) == (2, 1)
    again = Entity(id="person:a", type="person", label="A", attributes={"role": "witness", "aliases": ["Bhau"]}, sources=["case:2"])
    more = Relationship(id=edge.id, source="person:a", target="person:b", type="associate_of", attributes={"evidence": "x"}, sources=["case:2"])
    assert store.merge([again], [more]) == (0, 0)
    node = store.graph.nodes["person:a"]
    assert node["attributes"] == {"role": "accused", "aliases": ["Bhau"]}
    assert node["sources"] == ["case:1", "case:2"]
    data = store.graph.edges["person:a", "person:b"]
    assert (data["type"], data["weight"]) == ("co_accused", 2)
    assert data["attributes"] == {"evidence": "x", "types": ["co_accused", "associate_of"]}
    assert data["sources"] == ["case:1", "case:2"]


def test_save_load_and_reset(tmp_path):
    store = Store()
    result = ingest_cdr(io.StringIO(CDR))
    store.merge(result.entities, result.relationships)
    store.recompute()
    case = Case(id="case:FIR-2026-0001", fir_number="FIR-2026-0001", station="Kothrud", incident_time=datetime(2026, 7, 1, 10), sections=["BNS 303(2)"], entity_count=0, narrative="text", entities=[])
    store.cases[case.id] = case
    store.save(tmp_path / "graph.json")
    loaded = Store()
    loaded.load(tmp_path / "graph.json")
    before, after = to_response(store.graph), to_response(loaded.graph)
    assert {n.id: n for n in after.nodes} == {n.id: n for n in before.nodes}
    assert {e.id: e for e in after.edges} == {e.id: e for e in before.edges}
    assert loaded.cases == store.cases
    assert loaded.alerts == store.alerts
    assert loaded.graph.nodes["phone:9800000001"]["metrics"]["degree"] == 2
    loaded.reset()
    assert loaded.graph.number_of_nodes() == 0 and loaded.cases == {} and loaded.alerts == []


ROUTES = [
    ("person:x", "case:c1", "mentioned_in"),
    ("case:c1", "person:y", "mentioned_in"),
    ("person:x", "phone:9800000001", "owns"),
    ("phone:9800000001", "phone:9800000002", "called"),
    ("phone:9800000002", "person:y", "owns"),
    ("person:v", "person:w", "co_accused"),
]


def test_entity_reports_neighbors():
    store = graph_of(GANGS)
    detail = store.entity("person:m")
    assert detail.entity.id == "person:m"
    assert detail.metrics.degree == 2
    assert {(n.id, n.type, n.label, n.relationship, n.edge_id) for n in detail.neighbors} == {
        ("person:a0", "person", "a0", "associate_of", edge_id("person:m", "person:a0")),
        ("person:b0", "person", "b0", "associate_of", edge_id("person:m", "person:b0")),
    }
    assert store.entity("person:nobody") is None


def test_ego_grows_with_depth():
    store = graph_of(GANGS)
    near = store.ego("person:m", 1)
    assert {n.id for n in near.nodes} == {"person:m", "person:a0", "person:b0"}
    assert {e.id for e in near.edges} == {edge_id("person:m", "person:a0"), edge_id("person:m", "person:b0")}
    far = store.ego("person:m", 2)
    gang = {f"person:{side}{i}" for side in "ab" for i in range(10)}
    assert {n.id for n in far.nodes} == gang | {"person:m"}
    assert {e.id for e in far.edges} == {edge_id(a, b) for a, b, _ in GANGS}
    assert store.ego("person:nobody") is None


def test_path_skips_case_nodes_unless_endpoint():
    store = graph_of(ROUTES)
    route = store.path("person:x", "person:y")
    assert route.node_ids == ["person:x", "phone:9800000001", "phone:9800000002", "person:y"]
    assert route.edge_ids == [
        edge_id("person:x", "phone:9800000001"),
        edge_id("phone:9800000001", "phone:9800000002"),
        edge_id("phone:9800000002", "person:y"),
    ]
    assert store.path("case:c1", "person:y").node_ids == ["case:c1", "person:y"]
    assert store.path("person:x", "person:v") is None
    assert store.path("person:x", "person:nobody") is None
