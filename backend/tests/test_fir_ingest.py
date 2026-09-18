import re
from datetime import datetime
from pathlib import Path

import pytest

from app.extract import llm
from app.ingest.fir import ingest_fir

SEED_FIR_DIR = Path(__file__).resolve().parent.parent / "data" / "seed" / "fir"
INJECTION_FIR = Path(__file__).resolve().parent / "fixtures" / "injection_fir.txt"
TEXT = "Ramesh More alias Baba, r/o Karve Nagar, Warje, Pune, called Vaibhav Sawant from mobile +91 98220 11223 and fled on MH 12 AB 1234."


def squash(value: str) -> str:
    return re.sub(r"[\s-]", "", value).lower()


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_validate_drops_strings_absent_from_text():
    raw = {
        "persons": [
            {"name": "Ramesh More", "aliases": ["Baba", "Bhai"], "role": "accused"},
            {"name": "Vaibhav Sawant", "aliases": [], "role": "victim"},
            {"name": "Admin User", "aliases": [], "role": "accused"},
        ],
        "locations": ["Warje", "Mumbai"],
        "phones": [{"number": "9822011223", "owner": "Admin User"}, {"number": "9000000000", "owner": "Ramesh More"}],
        "relationships": [
            {"subject": "Ramesh More", "predicate": "called", "object": "Vaibhav Sawant", "evidence": "called Vaibhav Sawant"},
            {"subject": "Admin User", "predicate": "owns", "object": "9822011223", "evidence": ""},
        ],
    }
    extraction = llm.validate(TEXT, raw)
    assert [p.name for p in extraction.persons] == ["Ramesh More", "Vaibhav Sawant"]
    assert extraction.persons[0].aliases == ["Baba"]
    assert extraction.locations == ["Warje"]
    assert [(p.number, p.owner) for p in extraction.phones] == [("9822011223", None)]
    assert [(r.subject, r.predicate, r.object) for r in extraction.relationships] == [("Ramesh More", "called", "Vaibhav Sawant")]


def test_validate_normalizes_identifiers_and_relationship_ends():
    raw = {
        "persons": [{"name": "ramesh more", "role": "suspect"}],
        "phones": [{"number": 9822011223, "owner": "Ramesh More"}],
        "vehicles": [{"plate": "MH 12 AB 1234", "owner": "ramesh more"}],
        "relationships": [
            {"subject": "Ramesh More", "predicate": "owns", "object": "+91-98220-11223"},
            {"subject": "Ramesh More", "predicate": "threatened", "object": "Vaibhav Sawant"},
        ],
    }
    extraction = llm.validate(TEXT, raw)
    assert extraction.persons[0].role is None
    assert [(p.number, p.owner) for p in extraction.phones] == [("9822011223", "ramesh more")]
    assert [(v.plate, v.owner) for v in extraction.vehicles] == [("MH12AB1234", "ramesh more")]
    assert [(r.predicate, r.object) for r in extraction.relationships] == [("owns", "9822011223")]


def test_validate_drops_empty_names():
    extraction = llm.validate(TEXT, {"persons": [{"name": " "}], "locations": [""]})
    assert extraction.persons == []
    assert extraction.locations == []


@pytest.fixture(scope="module")
def first_fir():
    return ingest_fir(read(SEED_FIR_DIR / "FIR-2026-0001.txt"))


def test_seed_fir_yields_accused_phone_and_vehicle_with_owns_edges(first_fir):
    entities = {e.id for e in first_fir.entities}
    edges = {e.id: e for e in first_fir.relationships}
    accused = {"person:ramesh more", "person:vaibhav sawant", "person:aslam khan"}
    assert accused <= entities
    assert all(edges[f"case:FIR-2026-0001|{pid}"].attributes["role"] == "accused" for pid in accused)
    assert edges["person:ramesh more|phone:8210470952"].type == "owns"
    assert edges["person:swapnil joshi|phone:9774964990"].type == "owns"
    vehicle_edges = [e for e in edges.values() if "vehicle:MH14JX0154" in (e.source, e.target)]
    assert [e.type for e in vehicle_edges] == ["owns"]
    assert vehicle_edges[0].source in accused
    assert sum(e.type == "co_accused" for e in edges.values()) == 3
    assert all(e.sources == ["case:FIR-2026-0001"] for e in first_fir.entities + first_fir.relationships)


def test_seed_fir_case_carries_header_fields(first_fir):
    case = first_fir.case
    assert case.id == "case:FIR-2026-0001"
    assert case.fir_number == "FIR-2026-0001"
    assert case.station == "Shivajinagar"
    assert case.incident_time == datetime(2026, 6, 14, 15, 59)
    assert case.sections == ["BNS 308(2)", "BNS 351(3)", "BNS 3(5)"]
    assert case.entity_count == len(first_fir.entities) - 1
    node = next(e for e in first_fir.entities if e.id == case.id)
    assert node.type == "case"
    assert node.attributes["amounts"] == [440000]
    assert node.attributes["incident_time"] == "2026-06-14T15:59:00"


def test_seed_fir_locations_carry_coordinates(first_fir):
    place = next(e for e in first_fir.entities if e.id == "location:shivajinagar")
    assert (place.attributes["lat"], place.attributes["lon"]) == (18.5308, 73.8475)


def test_seed_fir_spans_match_labels_without_overlap(first_fir):
    case = first_fir.case
    entities = {e.id: e for e in first_fir.entities}
    assert {s.id for s in case.entities} >= {"person:ramesh more", "phone:8210470952", "vehicle:MH14JX0154"}
    for span in case.entities:
        entity = entities[span.id]
        assert span.label == entity.label
        forms = {squash(entity.label), *map(squash, entity.attributes.get("aliases", []))}
        assert squash(case.narrative[span.start : span.end]) in forms
    starts = [s.start for s in case.entities]
    assert starts == sorted(starts)
    assert all(a.end <= b.start for a, b in zip(case.entities, case.entities[1:]))


def test_injection_fir_yields_no_admin_user():
    result = ingest_fir(read(INJECTION_FIR))
    assert "admin user" not in {e.label.lower() for e in result.entities}
    assert "person:ganesh pawar" in {e.id for e in result.entities}


def test_every_seed_fir_is_cached():
    missing = [p.name for p in sorted(SEED_FIR_DIR.glob("*.txt")) if not llm.cache_path(read(p)).exists()]
    assert missing == []


def test_cached_fir_needs_no_network(monkeypatch):
    monkeypatch.setattr(llm, "_create", lambda text: pytest.fail("network call for a cached FIR"))
    ingest_fir(read(SEED_FIR_DIR / "FIR-2026-0002.txt"))
