from app.schemas import EntityType

PREFIXES = {"organization": "org"}
NAMED_TYPES = {"person", "location", "organization"}


def entity_id(type: EntityType, label: str) -> str:
    key = " ".join(label.split()).lower() if type in NAMED_TYPES else label
    return f"{PREFIXES.get(type, type)}:{key}"


def edge_id(a: str, b: str) -> str:
    return "|".join(sorted((a, b)))
