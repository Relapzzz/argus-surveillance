import pandas as pd

from app.ingest import MAX_ROWS, edge_id, entity_id
from app.schemas import Entity, Ingest, Relationship


def ingest_persons(source) -> Ingest:
    df = pd.read_csv(source, dtype=str, nrows=MAX_ROWS).fillna("")
    entities, relationships = [], []
    for row in df.itertuples():
        pid = entity_id("person", row.name)
        attributes = {"aliases": [row.alias] if row.alias else [], "address": row.address, "prior_case_count": int(row.prior_case_count)}
        entities.append(Entity(id=pid, type="person", label=row.name, attributes=attributes))
        for type, number in (("phone", row.phone), ("account", row.account)):
            if number:
                id = entity_id(type, number)
                entities.append(Entity(id=id, type=type, label=number))
                relationships.append(Relationship(id=edge_id(pid, id), source=pid, target=id, type="owns"))
    return Ingest(entities=entities, relationships=relationships)
