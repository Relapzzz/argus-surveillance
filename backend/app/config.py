from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""
    extraction_engine: Literal["llm", "custom"] = "llm"
    api_key: str = ""
    cors_origin: str = "http://localhost:5173"
    data_dir: Path = Path(__file__).resolve().parent.parent / "data"


settings = Settings()
