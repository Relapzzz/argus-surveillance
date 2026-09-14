import secrets
from typing import Annotated

from fastapi import Header, HTTPException

from app.config import settings


def require_api_key(x_api_key: Annotated[str, Header()] = "") -> None:
    if not settings.api_key or not secrets.compare_digest(x_api_key.encode(), settings.api_key.encode()):
        raise HTTPException(401, "invalid api key")
