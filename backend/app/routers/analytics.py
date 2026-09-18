from fastapi import APIRouter, HTTPException

from app.graph import analytics
from app.routers import StoreDep
from app.schemas import Alert, Community, KeyPlayer, PathResponse

router = APIRouter(prefix="/analytics")


@router.get("/key-players")
def key_players(store: StoreDep, limit: int = 10) -> list[KeyPlayer]:
    return analytics.key_players(store.graph, limit)


@router.get("/communities")
def communities(store: StoreDep) -> list[Community]:
    return analytics.communities(store.graph)


@router.get("/alerts")
def alerts(store: StoreDep) -> list[Alert]:
    return store.alerts


@router.get("/path")
def path(store: StoreDep, source: str, target: str) -> PathResponse:
    response = store.path(source, target)
    if response is None:
        raise HTTPException(404, "no path")
    return response
