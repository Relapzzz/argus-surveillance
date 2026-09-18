from app.places import coordinates


def test_known_label_returns_coordinates():
    assert coordinates("Kothrud") == {"lat": 18.5074, "lon": 73.8077}


def test_label_is_normalised_like_entity_ids():
    assert coordinates("  KONDHWA   Khurd ") == {"lat": 18.4711, "lon": 73.8925}


def test_unknown_label_returns_empty():
    assert coordinates("Nagpur") == {}
