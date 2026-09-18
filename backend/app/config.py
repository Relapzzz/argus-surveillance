from pathlib import Path
from typing import Any, Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""
    llm_extra_body: dict[str, Any] = {}
    extraction_engine: Literal["llm", "custom"] = "llm"
    api_key: str = ""
    cors_origin: str = "http://localhost:5173"
    graph_store: Literal["json", "neo4j"] = "json"
    neo4j_uri: str = ""
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""
    data_dir: Path = Path(__file__).resolve().parent.parent / "data"


settings = Settings()
