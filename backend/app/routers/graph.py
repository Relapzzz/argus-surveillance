from typing import get_args

from fastapi import APIRouter, HTTPException

from app.graph import analytics
from app.graph.store import Store, to_response
from app.routers import StoreDep
from app.schemas import EntityDetail, EntityType, GraphResponse, Neighbor, Stats

router = APIRouter()


def node_or_404(store: Store, entity_id: str) -> dict:
    if entity_id not in store.graph:
        raise HTTPException(404, "entity not found")
    return store.graph.nodes[entity_id]


@router.get("/stats")
def stats(store: StoreDep) -> Stats:
    counts = dict.fromkeys(get_args(EntityType), 0)
    for _, data in store.graph.nodes(data=True):
        counts[data["type"]] += 1
    return Stats(entities=counts, relationships=store.graph.number_of_edges(), cases=len(store.cases), alerts=len(store.alerts))


@router.get("/graph")
def graph(store: StoreDep, types: str | None = None, community: int | None = None, min_degree: int = 0) -> GraphResponse:
    wanted = set(types.split(",")) if types else set(get_args(EntityType))
    kept = [
        id
        for id, data in store.graph.nodes(data=True)
        if data["type"] in wanted
        and (community is None or data["metrics"]["community"] == community)
        and data["metrics"]["degree"] >= min_degree
    ]
    return to_response(store.graph.subgraph(kept))


@router.get("/entities/{entity_id}")
def entity(store: StoreDep, entity_id: str) -> EntityDetail:
    data = node_or_404(store, entity_id)
    neighbors = [
        Neighbor(
            id=other,
            type=store.graph.nodes[other]["type"],
            label=store.graph.nodes[other]["label"],
            relationship=edge["type"],
            edge_id=edge["id"],
        )
        for other, edge in store.graph[entity_id].items()
    ]
    return EntityDetail(entity={"id": entity_id, **data}, metrics=data["metrics"], neighbors=neighbors, sources=data["sources"])


@router.get("/entities/{entity_id}/ego")
def ego(store: StoreDep, entity_id: str, depth: int = 1) -> GraphResponse:
    node_or_404(store, entity_id)
    return to_response(analytics.ego(store.graph, entity_id, depth))
