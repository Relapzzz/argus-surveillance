import pandas as pd

from app.ingest import MAX_ROWS, edge_id, entity_id
from app.schemas import Entity, Ingest, Relationship


def ingest_cdr(source) -> Ingest:
    df = pd.read_csv(source, dtype=str, nrows=MAX_ROWS, usecols=["caller", "callee", "start_time", "tower_location"]).fillna("")
    calls: dict[str, tuple[str, str, list[tuple[str, str]]]] = {}
    for row in df.itertuples():
        a, b = entity_id("phone", row.caller), entity_id("phone", row.callee)
        calls.setdefault(edge_id(a, b), (a, b, []))[2].append((row.start_time, row.tower_location))
    relationships = []
    for id, (a, b, calls_made) in calls.items():
        calls_made.sort()
        stamps = [ts for ts, _ in calls_made]
        attributes = {
            "count": len(stamps),
            "first_seen": stamps[0],
            "last_seen": stamps[-1],
            "timestamps": stamps,
            "cells": [cell for _, cell in calls_made],
        }
        relationships.append(Relationship(id=id, source=a, target=b, type="called", weight=len(stamps), attributes=attributes))
    numbers = dict.fromkeys([*df["caller"], *df["callee"]])
    return Ingest(entities=[Entity(id=entity_id("phone", n), type="phone", label=n) for n in numbers], relationships=relationships)
