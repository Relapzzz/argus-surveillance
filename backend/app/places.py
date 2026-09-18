TOWERS = [
    ("T01", "Kothrud", 18.5074, 73.8077),
    ("T02", "Shivajinagar", 18.5308, 73.8475),
    ("T03", "Hadapsar", 18.5089, 73.9260),
    ("T04", "Warje", 18.4783, 73.8072),
    ("T05", "Kondhwa", 18.4636, 73.8872),
    ("T06", "Yerwada", 18.5580, 73.8827),
    ("T07", "Hinjewadi", 18.5908, 73.7397),
    ("T08", "Swargate", 18.5006, 73.8580),
    ("T09", "Camp", 18.5157, 73.8794),
    ("T10", "Baner", 18.5590, 73.7868),
]

PLACES: dict[str, tuple[float, float]] = {
    **{area.lower(): (lat, lon) for _, area, lat, lon in TOWERS},
    "karve nagar": (18.4898, 73.8225),
    "kondhwa khurd": (18.4711, 73.8925),
    "pashan": (18.5362, 73.7920),
    "mithanagar": (18.4693, 73.8912),
    "kausar baug": (18.4650, 73.8878),
    "pune": (18.5204, 73.8567),
}


def coordinates(label: str) -> dict[str, float]:
    place = PLACES.get(" ".join(label.split()).lower())
    return {"lat": place[0], "lon": place[1]} if place else {}
