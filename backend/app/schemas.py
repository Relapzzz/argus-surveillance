from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

EntityType = Literal["person", "phone", "vehicle", "location", "organization", "account", "case"]
RelationshipType = Literal["called", "transacted", "co_accused", "owns", "resides_at", "seen_at", "member_of", "mentioned_in", "associate_of"]
AlertType = Literal["burst_calls", "structuring", "bridge_node", "night_calls"]
Severity = Literal["low", "medium", "high"]
Role = Literal["accused", "complainant", "victim", "witness"]


class Entity(BaseModel):
    id: str
    type: EntityType
    label: str
    attributes: dict[str, Any] = {}
    sources: list[str] = []


class Metrics(BaseModel):
    degree: int
    betweenness: float
    pagerank: float
    community: int


class GraphNode(Entity):
    metrics: Metrics


class Relationship(BaseModel):
    id: str
    source: str
    target: str
    type: RelationshipType
    weight: int = 1
    attributes: dict[str, Any] = {}
    sources: list[str] = []


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[Relationship]


class Neighbor(BaseModel):
    id: str
    type: EntityType
    label: str
    relationship: RelationshipType
    edge_id: str


class EntityDetail(BaseModel):
    entity: Entity
    metrics: Metrics
    neighbors: list[Neighbor]
    sources: list[str]


class Stats(BaseModel):
    entities: dict[EntityType, int]
    relationships: int
    cases: int
    alerts: int


class KeyPlayer(BaseModel):
    entity_id: str
    label: str
    score: float
    degree: int
    betweenness: float
    pagerank: float
    community: int
    reason: str


class Community(BaseModel):
    id: int
    size: int
    member_ids: list[str]
    top_member: str


class Alert(BaseModel):
    id: str
    type: AlertType
    severity: Severity
    title: str
    description: str
    entity_ids: list[str]
    evidence: dict[str, Any] = {}


class PathResponse(BaseModel):
    node_ids: list[str]
    edge_ids: list[str]


class CaseSummary(BaseModel):
    id: str
    fir_number: str
    station: str
    incident_time: datetime
    sections: list[str]
    entity_count: int


class Span(BaseModel):
    id: str
    type: EntityType
    label: str
    start: int
    end: int


class Case(CaseSummary):
    narrative: str
    entities: list[Span]


class ExtractedPerson(BaseModel):
    name: str
    aliases: list[str] = []
    role: Role | None = None


class ExtractedPhone(BaseModel):
    number: str
    owner: str | None = None


class ExtractedVehicle(BaseModel):
    plate: str
    owner: str | None = None


class ExtractedAccount(BaseModel):
    number: str
    owner: str | None = None


class ExtractedRelationship(BaseModel):
    subject: str
    predicate: RelationshipType
    object: str
    evidence: str = ""


class Extraction(BaseModel):
    persons: list[ExtractedPerson] = []
    organizations: list[str] = []
    locations: list[str] = []
    phones: list[ExtractedPhone] = []
    vehicles: list[ExtractedVehicle] = []
    accounts: list[ExtractedAccount] = []
    relationships: list[ExtractedRelationship] = []


class IngestResult(BaseModel):
    case_id: str | None = None
    entities_added: int
    relationships_added: int
