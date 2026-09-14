import hashlib
import re
from itertools import combinations

from app.extract import regex
from app.extract.engine import extract
from app.ingest import edge_id, entity_id
from app.schemas import Case, Entity, EntityType, FirIngest, Relationship, RelationshipType, Span

STATION_RE = re.compile(r"Police Station\s+([^,.\n]+)")


class Builder:
    def __init__(self, case_id: str) -> None:
        self.case_id = case_id
        self.entities: dict[str, Entity] = {}
        self.edges: dict[str, Relationship] = {}
        self.ids: dict[str, str] = {}

    def entity(self, type: EntityType, label: str, **attributes) -> str:
        id = entity_id(type, label)
        if id not in self.entities:
            self.entities[id] = Entity(id=id, type=type, label=label, attributes=attributes, sources=[self.case_id])
            self.ids[label.lower()] = id
        return id

    def edge(self, source: str, target: str, type: RelationshipType, **attributes) -> None:
        id = edge_id(source, target)
        edge = self.edges.get(id)
        if edge is None:
            self.edges[id] = Relationship(id=id, source=source, target=target, type=type, attributes=attributes, sources=[self.case_id])
            return
        if type != edge.type:
            types = edge.attributes.setdefault("types", [edge.type])
            if type not in types:
                types.append(type)
        edge.attributes = attributes | edge.attributes

    def identifier(self, type: EntityType, label: str, owner: str | None) -> None:
        id = self.entity(type, label)
        owner_id = self.ids.get(owner.lower()) if owner else None
        if owner_id:
            self.edge(owner_id, id, "owns")
        else:
            self.edge(id, self.case_id, "mentioned_in")


def spans(text: str, entities: list[Entity]) -> list[Span]:
    labels = [(label, entity) for entity in entities for label in (entity.label, *entity.attributes.get("aliases", []))]
    found: list[Span] = []
    for label, entity in sorted(labels, key=lambda item: -len(item[0])):
        for start, end in regex.find_spans(text, label):
            if not any(span.start < end and start < span.end for span in found):
                found.append(Span(id=entity.id, type=entity.type, label=entity.label, start=start, end=end))
    return sorted(found, key=lambda span: span.start)


def ingest_fir(text: str) -> FirIngest:
    text = text.replace("\r\n", "\n")
    numbers = regex.fir_numbers(text)
    fir_number = numbers[0] if numbers else f"FIR-UPLOAD-{hashlib.sha256(text.encode()).hexdigest()[:8]}"
    station = STATION_RE.search(text)
    station_name = station.group(1) if station else ""
    dates = regex.dates(text)
    incident_time = min(dates) if dates else None
    sections = [f"{act} {section}" for act, section in regex.sections(text)]
    case_id = entity_id("case", fir_number)
    builder = Builder(case_id)
    builder.entity(
        "case",
        fir_number,
        fir_number=fir_number,
        station=station_name,
        incident_time=incident_time.isoformat() if incident_time else None,
        sections=sections,
        amounts=regex.amounts(text),
    )
    extraction = extract(text)
    for person in extraction.persons:
        pid = builder.entity("person", person.name, aliases=person.aliases, role=person.role)
        builder.edge(pid, case_id, "mentioned_in", role=person.role)
    accused = list(dict.fromkeys(entity_id("person", p.name) for p in extraction.persons if p.role == "accused"))
    for a, b in combinations(accused, 2):
        builder.edge(a, b, "co_accused")
    for type, labels in (("organization", extraction.organizations), ("location", extraction.locations)):
        for label in labels:
            builder.edge(builder.entity(type, label), case_id, "mentioned_in")
    for phone in extraction.phones:
        builder.identifier("phone", phone.number, phone.owner)
    for vehicle in extraction.vehicles:
        builder.identifier("vehicle", vehicle.plate, vehicle.owner)
    for account in extraction.accounts:
        builder.identifier("account", account.number, account.owner)
    for r in extraction.relationships:
        source, target = builder.ids.get(r.subject.lower()), builder.ids.get(r.object.lower())
        if source and target:
            builder.edge(source, target, r.predicate, evidence=r.evidence)
    for type, values in (("phone", regex.phones(text)), ("vehicle", regex.vehicles(text)), ("account", regex.accounts(text))):
        for value in values:
            if entity_id(type, value) not in builder.entities:
                builder.identifier(type, value, None)
    entities = list(builder.entities.values())
    case = Case(
        id=case_id,
        fir_number=fir_number,
        station=station_name,
        incident_time=incident_time,
        sections=sections,
        entity_count=len(entities) - 1,
        narrative=text,
        entities=spans(text, entities),
    )
    return FirIngest(case=case, entities=entities, relationships=list(builder.edges.values()))
