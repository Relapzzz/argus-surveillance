from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.graph.store import Store
from app.routers import analytics, cases, graph, ingest


@asynccontextmanager
async def lifespan(app: FastAPI):
    store = Store()
    store.load(settings.data_dir / "graph.json")
    app.state.store = store
    yield


app = FastAPI(title="Criminal Network Analysis API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[settings.cors_origin], allow_methods=["*"], allow_headers=["*"])
for module in (graph, analytics, cases, ingest):
    app.include_router(module.router, prefix="/api")
