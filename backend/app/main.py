from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.graph.store import Neo4jStore, Store
from app.routers import analytics, cases, graph, ingest


def open_store() -> Store:
    if settings.graph_store == "neo4j":
        store = Neo4jStore()
        store.pull()
        return store
    store = Store()
    store.load(settings.data_dir / "graph.json")
    return store


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.store = open_store()
    yield
    app.state.store.close()


app = FastAPI(title="VYUHA API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[settings.cors_origin], allow_methods=["*"], allow_headers=["*"])
for module in (graph, analytics, cases, ingest):
    app.include_router(module.router, prefix="/api")
