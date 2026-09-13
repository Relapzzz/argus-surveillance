from datetime import datetime
from pathlib import Path

import pytest

from app.extract import regex

SEED_FIR_DIR = Path(__file__).resolve().parent.parent / "data" / "seed" / "fir"


@pytest.mark.parametrize(
    "text,expected",
    [
        ("+91 98220 11223", ["9822011223"]),
        ("09822011223", ["9822011223"]),
        ("9822011223", ["9822011223"]),
        ("mobile 9190659401.", ["9190659401"]),
        ("The accused later called the complainant from mobile number 8170805310.", ["8170805310"]),
        ("919822011223", []),
    ],
)
def test_phones(text, expected):
    assert regex.phones(text) == expected


@pytest.mark.parametrize(
    "text,expected",
    [
        ("MH 12 AB 1234", ["MH12AB1234"]),
        ("MH12AB1234", ["MH12AB1234"]),
        ("MH-12-AB-1234", ["MH12AB1234"]),
        ("DL1CAB1234", ["DL1CAB1234"]),
        ("registration MH 12 CQ 5662, who insisted", ["MH12CQ5662"]),
    ],
)
def test_vehicles(text, expected):
    assert regex.vehicles(text) == expected


@pytest.mark.parametrize(
    "text,expected",
    [
        ("u/s 379 IPC", [("IPC", "379")]),
        ("IPC 420", [("IPC", "420")]),
        ("Section 303(2) BNS", [("BNS", "303(2)")]),
        ("Sections 303(2), 351(3) BNS 2023", [("BNS", "303(2)"), ("BNS", "351(3)")]),
        (
            "Sections: 308(2), 351(3), 3(5) BNS 2023, 66D IT Act 2000.",
            [("BNS", "308(2)"), ("BNS", "351(3)"), ("BNS", "3(5)"), ("IT Act", "66D")],
        ),
        (
            "Sections: 8(c) r/w 22(b) NDPS Act 1985.",
            [("NDPS Act", "8(c)"), ("NDPS Act", "22(b)")],
        ),
        (
            "Sections: 131, 3(5) BNS 2023.",
            [("BNS", "131"), ("BNS", "3(5)")],
        ),
        ("BNS 3(5)", [("BNS", "3(5)")]),
        ("IPC 304(2)", [("IPC", "304(2)")]),
        ("IPC 120B", [("IPC", "120B")]),
        ("IT Act 66D", [("IT Act", "66D")]),
        ("Sections 420 and 120B IPC", [("IPC", "420"), ("IPC", "120B")]),
        ("U/s 379 IPC", [("IPC", "379")]),
        (
            "Sections: 8(c) r/w 20(b)(ii)(C) NDPS Act 1985.",
            [("NDPS Act", "8(c)"), ("NDPS Act", "20(b)(ii)(C)")],
        ),
    ],
)
def test_sections(text, expected):
    assert regex.sections(text) == expected


def test_fir_numbers():
    assert regex.fir_numbers("FIR No. 0142/2026") == ["FIR-2026-0142"]


@pytest.mark.parametrize(
    "text,expected",
    [
        ("Rs. 45,000", [45000]),
        ("Rs 45000", [45000]),
        ("INR 45,000", [45000]),
        ("INR 45000", [45000]),
        ("Rs. 1,02,800", [102800]),
        ("Rs. 1,63,000,", [163000]),
        ("demanded Rs. 4,40,000.", [440000]),
        ("Rs. 9", [9]),
    ],
)
def test_amounts(text, expected):
    assert regex.amounts(text) == expected


@pytest.mark.parametrize(
    "text,expected",
    [
        ("14/07/2026 at 22:40 hrs", [datetime(2026, 7, 14, 22, 40)]),
        ("23/08/2026 at about 08:13 hrs", [datetime(2026, 8, 23, 8, 13)]),
        ("14/07/2026", [datetime(2026, 7, 14)]),
    ],
)
def test_dates(text, expected):
    assert regex.dates(text) == expected


@pytest.mark.parametrize(
    "text,expected",
    [
        ("account number 12345678901234", ["12345678901234"]),
        ("09822011223", []),
        ("919822011223", ["919822011223"]),
    ],
)
def test_accounts(text, expected):
    assert regex.accounts(text) == expected


def test_find_spans_matches_case_insensitive_non_overlapping():
    text = "Ramesh More alias Baba met ramesh more near the station."
    spans = regex.find_spans(text, "Ramesh More")
    assert spans == [(0, 11), (27, 38)]
    assert all(text[s:e].lower() == "ramesh more" for s, e in spans)


def test_find_spans_no_match_is_empty():
    assert regex.find_spans("hello world", "nowhere") == []


@pytest.mark.parametrize("path", sorted(SEED_FIR_DIR.glob("*.txt")))
def test_seed_corpus_yields_one_matching_fir_number(path):
    text = path.read_text()
    regex.phones(text)
    regex.vehicles(text)
    regex.amounts(text)
    regex.dates(text)
    regex.accounts(text)
    assert regex.sections(text)
    numbers = regex.fir_numbers(text)
    expected = path.stem
    assert numbers == [expected]
