import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.extract import llm
from app.ingest.fir import ingest_fir

FIR_DIR = settings.data_dir / "seed" / "fir"
PAUSE = 8 if "groq" in settings.llm_base_url else 0


def main() -> None:
    for path in sorted(FIR_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        cached = llm.cache_path(text).exists()
        result = ingest_fir(text)
        print(f"{result.case.id}: {len(result.entities)} entities, {len(result.relationships)} relationships")
        if PAUSE and not cached:
            time.sleep(PAUSE)


if __name__ == "__main__":
    main()
