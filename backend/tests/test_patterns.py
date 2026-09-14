import io

from conftest import GANGS, graph_of

from app.graph.store import Store
from app.ingest.cdr import ingest_cdr
from app.ingest.transactions import ingest_transactions

CDR_HEADER = "caller,callee,start_time,duration_sec,tower_id,tower_location\n"
TXN_HEADER = "txn_id,from_account,to_account,amount,timestamp,mode\n"


def stamp(day: int, hour: int, minute: int = 0) -> str:
    return f"2026-07-{day:02d}T{hour:02d}:{minute:02d}:00+05:30"


def alerts_for(ingest, csv: str):
    store = Store()
    result = ingest(io.StringIO(csv))
    store.merge(result.entities, result.relationships)
    store.recompute()
    return store.alerts


def calls(rows):
    return alerts_for(ingest_cdr, CDR_HEADER + "".join(f"{a},{b},{ts},60,T01,Kothrud\n" for a, b, ts in rows))


def transfers(rows):
    return alerts_for(ingest_transactions, TXN_HEADER + "".join(f"TXN{i},{a},{b},{amount},{ts},IMPS\n" for i, (a, b, amount, ts) in enumerate(rows)))


def test_burst_calls_needs_eight_calls_inside_an_hour():
    rows = [("9800000001", "9800000002", stamp(1, 20, 5 * i)) for i in range(8)]
    alerts = calls(rows)
    assert [a.type for a in alerts] == ["burst_calls"]
    alert = alerts[0]
    assert (alert.id, alert.severity) == ("alert:burst_calls:phone:9800000001|phone:9800000002", "high")
    assert alert.evidence["count"] == 8 and alert.evidence["window_minutes"] == 35
    assert alert.evidence["start"] == "2026-07-01T20:00:00+05:30" and alert.evidence["end"] == "2026-07-01T20:35:00+05:30"
    assert set(alert.entity_ids) == {"phone:9800000001", "phone:9800000002"}
    assert calls(rows[:7]) == []
    assert calls([("9800000001", "9800000002", stamp(1 + i, 20)) for i in range(9)]) == []


def test_structuring_needs_five_sub_threshold_transfers_in_a_week():
    mule = "22222222222"
    rows = [(f"1000000000{i}", mule, 40000 + 1000 * i, stamp(1 + i, 10)) for i in range(5)]
    forward = (mule, "99999999999", 210000, stamp(7, 12))
    alerts = transfers(rows + [forward])
    assert [a.type for a in alerts] == ["structuring"]
    alert = alerts[0]
    assert (alert.id, alert.severity) == (f"alert:structuring:account:{mule}", "high")
    assert alert.evidence["count"] == 5 and alert.evidence["total_amount"] == 210000
    assert alert.evidence["forwarded_to"] == "account:99999999999"
    assert alert.entity_ids[0] == f"account:{mule}" and "account:99999999999" in alert.entity_ids
    assert transfers(rows[:4]) == []
    assert transfers([(a, b, 50000, ts) for a, b, _, ts in rows]) == []
    assert transfers([(a, b, amount, stamp(1 + 2 * i, 10)) for i, (a, b, amount, _) in enumerate(rows)]) == []


def test_night_calls_needs_ten_calls_mostly_between_midnight_and_four():
    burner = "9800000009"
    night = [(burner, f"98000000{i:02d}", stamp(1 + i, i % 4, 30)) for i in range(8)]
    day = [(burner, "9800000001", stamp(10 + i, 14)) for i in range(3)]
    alerts = calls(night + day[:2])
    assert [a.type for a in alerts] == ["night_calls"]
    alert = alerts[0]
    assert (alert.id, alert.severity) == (f"alert:night_calls:phone:{burner}", "medium")
    assert alert.evidence["count"] == 10 and alert.evidence["night_count"] == 8
    assert alert.entity_ids[0] == f"phone:{burner}" and len(alert.entity_ids) == 9
    assert calls(night[:7] + day) == []


def test_bridge_node_flags_low_degree_high_betweenness_nodes():
    alerts = graph_of(GANGS).alerts
    assert [a.id for a in alerts] == ["alert:bridge_node:person:m"]
    alert = alerts[0]
    assert alert.severity == "medium"
    assert alert.evidence["degree"] == 2 and alert.evidence["communities"] == [0, 1]
    assert set(alert.entity_ids) == {"person:m", "person:a0", "person:b0"}


def test_bridge_node_reports_the_actor_with_its_identifiers():
    owned = GANGS + [("person:m", "phone:9", "owns"), ("phone:9", "phone:1", "called"), ("person:a1", "phone:1", "owns")]
    alerts = graph_of(owned).alerts
    assert [a.id for a in alerts] == ["alert:bridge_node:person:m"]
    assert alerts[0].entity_ids == ["person:m", "phone:9", "person:a0", "person:b0", "person:a1"]
    assert alerts[0].evidence["degree"] == 3
