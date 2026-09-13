import json
from itertools import pairwise
from typing import get_args

import networkx as nx
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas import (
    Alert,
    Case,
    CaseSummary,
    Community,
    EntityDetail,
    EntityType,
    GraphNode,
    GraphResponse,
    KeyPlayer,
    Neighbor,
    PathResponse,
    Relationship,
    Stats,
)

router = APIRouter(prefix="/api")
fixture = json.loads((settings.data_dir / "fixture_graph.json").read_text(encoding="utf-8"))
NODES = {n["id"]: GraphNode.model_validate(n) for n in fixture["nodes"]}
EDGES = {e["id"]: Relationship.model_validate(e) for e in fixture["edges"]}
ALERTS = [Alert.model_validate(a) for a in fixture["alerts"]]
CASES = {c["id"]: Case.model_validate(c | {"entity_count": len({s["id"] for s in c["entities"]})}) for c in fixture["cases"]}
G = nx.Graph()
G.add_nodes_from(NODES)
G.add_edges_from((e.source, e.target, {"id": e.id}) for e in EDGES.values())


def subgraph(ids) -> GraphResponse:
    ids = set(ids)
    return GraphResponse(
        nodes=[n for n in NODES.values() if n.id in ids],
        edges=[e for e in EDGES.values() if e.source in ids and e.target in ids],
    )


def node_or_404(entity_id: str) -> GraphNode:
    if entity_id not in NODES:
        raise HTTPException(404, "entity not found")
    return NODES[entity_id]


@router.get("/stats")
def stats() -> Stats:
    counts = dict.fromkeys(get_args(EntityType), 0)
    for n in NODES.values():
        counts[n.type] += 1
    return Stats(entities=counts, relationships=len(EDGES), cases=len(CASES), alerts=len(ALERTS))


@router.get("/graph")
def graph(types: str | None = None, community: int | None = None, min_degree: int = 0) -> GraphResponse:
    wanted = set(types.split(",")) if types else set(get_args(EntityType))
    return subgraph(
        n.id
        for n in NODES.values()
        if n.type in wanted and (community is None or n.metrics.community == community) and n.metrics.degree >= min_degree
    )


@router.get("/entities/{entity_id}")
def entity(entity_id: str) -> EntityDetail:
    node = node_or_404(entity_id)
    neighbors = [
        Neighbor(id=other, type=NODES[other].type, label=NODES[other].label, relationship=EDGES[data["id"]].type, edge_id=data["id"])
        for other, data in G[entity_id].items()
    ]
    return EntityDetail(entity=node, metrics=node.metrics, neighbors=neighbors, sources=node.sources)


@router.get("/entities/{entity_id}/ego")
def ego(entity_id: str, depth: int = 1) -> GraphResponse:
    node_or_404(entity_id)
    return subgraph(nx.ego_graph(G, entity_id, radius=depth))


@router.get("/analytics/key-players")
def key_players(limit: int = 10) -> list[KeyPlayer]:
    persons = sorted((n for n in NODES.values() if n.type == "person"), key=lambda n: n.metrics.pagerank, reverse=True)
    return [
        KeyPlayer(
            entity_id=n.id,
            label=n.label,
            score=n.metrics.pagerank,
            **n.metrics.model_dump(),
            reason=f"PageRank {n.metrics.pagerank:.3f} with {n.metrics.degree} connections in community {n.metrics.community}",
        )
        for n in persons[:limit]
    ]


@router.get("/analytics/communities")
def communities() -> list[Community]:
    groups: dict[int, list[GraphNode]] = {}
    for n in NODES.values():
        groups.setdefault(n.metrics.community, []).append(n)
    return [
        Community(id=c, size=len(members), member_ids=[m.id for m in members], top_member=max(members, key=lambda m: m.metrics.pagerank).id)
        for c, members in sorted(groups.items())
    ]


@router.get("/analytics/alerts")
def alerts() -> list[Alert]:
    return ALERTS


@router.get("/analytics/path")
def path(source: str, target: str) -> PathResponse:
    try:
        node_ids = nx.shortest_path(G, source, target)
    except (nx.NodeNotFound, nx.NetworkXNoPath):
        raise HTTPException(404, "no path")
    return PathResponse(node_ids=node_ids, edge_ids=[G.edges[a, b]["id"] for a, b in pairwise(node_ids)])


@router.get("/cases")
def cases() -> list[CaseSummary]:
    return [CaseSummary.model_validate(c.model_dump()) for c in CASES.values()]


@router.get("/cases/{case_id}")
def case(case_id: str) -> Case:
    if case_id not in CASES:
        raise HTTPException(404, "case not found")
    return CASES[case_id]


def not_implemented():
    raise HTTPException(501, "not implemented in the Phase 0 stub")


for route in ("/ingest/fir", "/ingest/cdr", "/ingest/transactions", "/admin/reset"):
    router.post(route)(not_implemented)
