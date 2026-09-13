from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import stub
from app.config import settings

app = FastAPI(title="Criminal Network Analysis API")
app.add_middleware(CORSMiddleware, allow_origins=[settings.cors_origin], allow_methods=["*"], allow_headers=["*"])
app.include_router(stub.router)
