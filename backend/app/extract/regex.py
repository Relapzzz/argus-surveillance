import re
from datetime import datetime

PHONE_RE = re.compile(r"(?<!\d)(?:\+91[\s-]?|0)?([6-9](?:[\s-]?\d){9})(?!\d)")
VEHICLE_RE = re.compile(r"\b([A-Z]{2})[\s-]?(\d{1,2})[\s-]?([A-Z]{1,3})[\s-]?(\d{4})\b")
SECTION_CLAUSE_RE = re.compile(r"\d+[a-zA-Z]*(?:\([a-zA-Z0-9]+\))*")
SECTION_KEYWORD_RE = re.compile(r"u/s|[Ss]ections?:?")
SECTION_CHUNK_RE = re.compile(
    r"([\w()]+(?:\s*,\s*[\w()]+|\s+r/w\s+[\w()]+)*)\s+(IPC|BNS|NDPS Act|IT Act)(?:\s+\d{4})?"
)
SECTION_ACT_FIRST_RE = re.compile(r"\b(IPC|BNS|NDPS Act|IT Act)\s+(\d{1,3}(?:\([a-zA-Z0-9]+\))*)\b")
FIR_NUMBER_RE = re.compile(r"FIR\s*No\.?\s*(\d+)/(\d{4})", re.IGNORECASE)
AMOUNT_RE = re.compile(r"(?:Rs\.?|INR)\s*([\d,]+\d)")
DATE_RE = re.compile(r"(\d{2})/(\d{2})/(\d{4})(?:\s+at\s+(?:about\s+)?(\d{2}):(\d{2})\s*hrs)?")
ACCOUNT_RE = re.compile(r"(?<!\d)\d{11,16}(?!\d)")


def phones(text: str) -> list[str]:
    seen = []
    for match in PHONE_RE.finditer(text):
        number = re.sub(r"[\s-]", "", match.group(1))
        if number not in seen:
            seen.append(number)
    return seen


def vehicles(text: str) -> list[str]:
    seen = []
    for match in VEHICLE_RE.finditer(text):
        plate = "".join(match.groups())
        if plate not in seen:
            seen.append(plate)
    return seen


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
    seen = []
    for _, act, clause in found:
        pair = (act, clause)
        if pair not in seen:
            seen.append(pair)
    return seen


def fir_numbers(text: str) -> list[str]:
    seen = []
    for number, year in FIR_NUMBER_RE.findall(text):
        value = f"FIR-{year}-{int(number):04d}"
        if value not in seen:
            seen.append(value)
    return seen


def amounts(text: str) -> list[int]:
    seen = []
    for match in AMOUNT_RE.finditer(text):
        value = int(match.group(1).replace(",", ""))
        if value not in seen:
            seen.append(value)
    return seen


def dates(text: str) -> list[datetime]:
    seen = []
    for day, month, year, hour, minute in DATE_RE.findall(text):
        value = datetime(int(year), int(month), int(day), int(hour or 0), int(minute or 0))
        if value not in seen:
            seen.append(value)
    return seen


def accounts(text: str) -> list[str]:
    phone_spans = [m.span() for m in PHONE_RE.finditer(text)]
    seen = []
    for match in ACCOUNT_RE.finditer(text):
        if any(start <= match.start() and match.end() <= end for start, end in phone_spans):
            continue
        number = match.group()
        if number not in seen:
            seen.append(number)
    return seen


def find_spans(text: str, label: str) -> list[tuple[int, int]]:
    pattern = re.compile(re.escape(label), re.IGNORECASE)
    return [match.span() for match in pattern.finditer(text)]
