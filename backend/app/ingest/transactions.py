import pandas as pd

from app.ingest import MAX_ROWS, edge_id, entity_id
from app.schemas import Entity, Ingest, Relationship


def ingest_transactions(source) -> Ingest:
    df = pd.read_csv(source, dtype=str, nrows=MAX_ROWS)
    transfers: dict[str, tuple[str, str, list[dict]]] = {}
    for row in df.itertuples():
        a, b = entity_id("account", row.from_account), entity_id("account", row.to_account)
        transfers.setdefault(edge_id(a, b), (a, b, []))[2].append({"amount": int(row.amount), "ts": row.timestamp, "to": b})
    relationships = []
    for id, (a, b, events) in transfers.items():
        events.sort(key=lambda event: event["ts"])
        attributes = {
            "count": len(events),
            "total_amount": sum(event["amount"] for event in events),
            "first_seen": events[0]["ts"],
            "last_seen": events[-1]["ts"],
            "transfers": events,
        }
        relationships.append(Relationship(id=id, source=a, target=b, type="transacted", weight=len(events), attributes=attributes))
    numbers = dict.fromkeys([*df["from_account"], *df["to_account"]])
    return Ingest(entities=[Entity(id=entity_id("account", n), type="account", label=n) for n in numbers], relationships=relationships)
