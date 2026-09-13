from app.config import settings
from app.extract import llm
from app.schemas import Extraction

ENGINES = {"llm": llm.extract}


def extract(text: str) -> Extraction:
    return ENGINES[settings.extraction_engine](text)
