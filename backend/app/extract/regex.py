import re
from datetime import datetime

PHONE_RE = re.compile(r"(?<!\d)(?:\+91[\s-]?|0)?([6-9](?:[\s-]?\d){9})(?!\d)")
PHONE_SEP_RE = re.compile(r"[\s-]")
VEHICLE_RE = re.compile(r"\b([A-Z]{2})[\s-]?(\d{1,2})[\s-]?([A-Z]{1,3})[\s-]?(\d{4})\b")
SECTION_TOKEN = r"\d+[a-zA-Z]*(?:\([a-zA-Z0-9]+\))*"
SECTION_CLAUSE_RE = re.compile(SECTION_TOKEN)
SECTION_KEYWORD_RE = re.compile(r"u/s|sections?:?", re.IGNORECASE)
SECTION_CHUNK_RE = re.compile(
    r"([\w()]+(?:\s*,\s*[\w()]+|\s+r/w\s+[\w()]+|\s+and\s+[\w()]+)*)\s+(IPC|BNS|NDPS Act|IT Act)(?:\s+\d{4})?"
)
SECTION_ACT_FIRST_RE = re.compile(rf"\b(IPC|BNS|NDPS Act|IT Act)\s+(?!\d{{4}}\b)({SECTION_TOKEN})")
FIR_NUMBER_RE = re.compile(r"FIR\s*No\.?\s*(\d+)/(\d{4})", re.IGNORECASE)
AMOUNT_RE = re.compile(r"(?:Rs\.?|INR)\s*([\d,]*\d)")
DATE_RE = re.compile(r"(\d{2})/(\d{2})/(\d{4})(?:\s+at\s+(?:about\s+)?(\d{2}):(\d{2})\s*hrs)?")
ACCOUNT_RE = re.compile(r"(?<!\d)\d{11,16}(?!\d)")


def phones(text: str) -> list[str]:
    return list(dict.fromkeys(PHONE_SEP_RE.sub("", m.group(1)) for m in PHONE_RE.finditer(text)))


def vehicles(text: str) -> list[str]:
    return list(dict.fromkeys("".join(m.groups()) for m in VEHICLE_RE.finditer(text)))


def sections(text: str) -> list[tuple[str, str]]:
    found = []
    for keyword in SECTION_KEYWORD_RE.finditer(text):
        scope_end = text.find(".", keyword.end())
        scope_end = len(text) if scope_end == -1 else scope_end
        scope = text[keyword.end() : scope_end]
        offset = keyword.end()
        for chunk in SECTION_CHUNK_RE.finditer(scope):
            clauses, act = chunk.group(1), chunk.group(2)
            clause_offset = offset + chunk.start(1)
            for clause in SECTION_CLAUSE_RE.finditer(clauses):
                found.append((clause_offset + clause.start(), act, clause.group()))
    for match in SECTION_ACT_FIRST_RE.finditer(text):
        found.append((match.start(), match.group(1), match.group(2)))
    found.sort(key=lambda item: item[0])
    return list(dict.fromkeys((act, clause) for _, act, clause in found))


def fir_numbers(text: str) -> list[str]:
    return list(dict.fromkeys(f"FIR-{year}-{int(number):04d}" for number, year in FIR_NUMBER_RE.findall(text)))


def amounts(text: str) -> list[int]:
    return list(dict.fromkeys(int(m.group(1).replace(",", "")) for m in AMOUNT_RE.finditer(text)))


def dates(text: str) -> list[datetime]:
    return list(
        dict.fromkeys(
            datetime(int(year), int(month), int(day), int(hour or 0), int(minute or 0))
            for day, month, year, hour, minute in DATE_RE.findall(text)
        )
    )


def accounts(text: str) -> list[str]:
    phone_spans = [m.span() for m in PHONE_RE.finditer(text)]
    return list(
        dict.fromkeys(
            m.group()
            for m in ACCOUNT_RE.finditer(text)
            if not any(start <= m.start() and m.end() <= end for start, end in phone_spans)
        )
    )


def find_spans(text: str, label: str) -> list[tuple[int, int]]:
    pattern = re.compile(re.escape(label), re.IGNORECASE)
    return [match.span() for match in pattern.finditer(text)]
