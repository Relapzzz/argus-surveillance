import io
from collections.abc import Callable
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from pydantic import ValidationError
from starlette.datastructures import UploadFile as FormFile

from app.config import settings
from app.graph.store import Store
from app.ingest.cdr import ingest_cdr
from app.ingest.fir import ingest_fir
from app.ingest.transactions import ingest_transactions
from app.routers import StoreDep
from app.schemas import FirText, Ingest, IngestResult, ResetResult
from app.security import require_api_key

router = APIRouter(dependencies=[Depends(require_api_key)])
MAX_BYTES = 2 * 1024 * 1024


async def read_upload(file: UploadFile, suffix: str) -> bytes:
    if Path(file.filename).suffix.lower() != suffix:
        raise HTTPException(415, "unsupported file type")
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "file too large")
    return data


async def read_body(request: Request) -> bytes:
    body = bytearray()
    async for chunk in request.stream():
        body += chunk
        if len(body) > MAX_BYTES:
            raise HTTPException(413, "body too large")
    return bytes(body)


async def fir_text(request: Request) -> str:
    if request.headers.get("content-type", "").startswith("multipart/form-data"):
        file = (await request.form()).get("file")
        if not isinstance(file, FormFile):
            raise HTTPException(422, "file field required")
        data = await read_upload(file, ".txt")
        try:
            return data.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(422, "file is not utf-8 text")
    try:
        return FirText.model_validate_json(await read_body(request)).text
    except ValidationError:
        raise HTTPException(422, "text field required")


def merge_csv(store: Store, ingest: Callable[[io.BytesIO], Ingest], data: bytes) -> IngestResult:
    try:
        result = ingest(io.BytesIO(data))
    except ValueError:
        raise HTTPException(422, "csv could not be read")
    nodes, edges = store.merge(result.entities, result.relationships)
    store.recompute()
    return IngestResult(entities_added=nodes, relationships_added=edges)


@router.post("/ingest/fir")
async def fir(store: StoreDep, request: Request) -> IngestResult:
    result = ingest_fir(await fir_text(request))
    nodes, edges = store.merge(result.entities, result.relationships)
    store.cases[result.case.id] = result.case
    store.recompute()
    return IngestResult(case_id=result.case.id, entities_added=nodes, relationships_added=edges)


@router.post("/ingest/cdr")
async def cdr(store: StoreDep, file: UploadFile) -> IngestResult:
    return merge_csv(store, ingest_cdr, await read_upload(file, ".csv"))


@router.post("/ingest/transactions")
async def transactions(store: StoreDep, file: UploadFile) -> IngestResult:
    return merge_csv(store, ingest_transactions, await read_upload(file, ".csv"))


@router.post("/admin/reset")
def reset(store: StoreDep) -> ResetResult:
    store.load(settings.data_dir / "graph.json")
    return ResetResult(nodes=store.graph.number_of_nodes(), edges=store.graph.number_of_edges())
