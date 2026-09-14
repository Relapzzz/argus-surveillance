from fastapi import APIRouter, HTTPException

from app.routers import StoreDep
from app.schemas import Case, CaseSummary

router = APIRouter(prefix="/cases")


@router.get("")
def cases(store: StoreDep) -> list[CaseSummary]:
    return list(store.cases.values())


@router.get("/{case_id}")
def case(store: StoreDep, case_id: str) -> Case:
    if case_id not in store.cases:
        raise HTTPException(404, "case not found")
    return store.cases[case_id]
