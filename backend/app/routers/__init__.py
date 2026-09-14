from typing import Annotated

from fastapi import Depends, Request

from app.graph.store import Store


def get_store(request: Request) -> Store:
    return request.app.state.store


StoreDep = Annotated[Store, Depends(get_store)]
