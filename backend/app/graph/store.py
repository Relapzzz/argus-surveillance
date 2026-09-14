import json
from pathlib import Path

import networkx as nx

from app.graph import analytics, patterns
from app.schemas import Alert, Case, Entity, GraphNode, GraphResponse, Relationship


def to_response(G: nx.Graph) -> GraphResponse:
    return GraphResponse(
        nodes=[GraphNode(id=id, **data) for id, data in G.nodes(data=True)],
        edges=[Relationship(**data) for _, _, data in G.edges(data=True)],
    )


class Store:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.graph = nx.Graph()
        self.cases: dict[str, Case] = {}
        self.alerts: list[Alert] = []

    def merge(self, entities: list[Entity], relationships: list[Relationship]) -> tuple[int, int]:
        G = self.graph
        nodes = edges = 0
        for entity in entities:
            if entity.id not in G:
                G.add_node(entity.id, **entity.model_dump(exclude={"id"}))
                nodes += 1
                continue
            data = G.nodes[entity.id]
            data["attributes"] = entity.attributes | data["attributes"]
            data["sources"] += [s for s in entity.sources if s not in data["sources"]]
        for rel in relationships:
            if not G.has_edge(rel.source, rel.target):
                G.add_edge(rel.source, rel.target, **rel.model_dump())
                edges += 1
                continue
            data = G.edges[rel.source, rel.target]
            data["weight"] += rel.weight
            types = list(dict.fromkeys([data["type"], *data["attributes"].get("types", []), rel.type, *rel.attributes.get("types", [])]))
            data["attributes"] = rel.attributes | data["attributes"]
            if len(types) > 1:
                data["attributes"]["types"] = types
            data["sources"] += [s for s in rel.sources if s not in data["sources"]]
        return nodes, edges

    def recompute(self) -> None:
        analytics.compute_metrics(self.graph)
        self.alerts = patterns.detect(self.graph)

    def save(self, path: Path) -> None:
        data = {
            "nodes": [{"id": id, **attributes} for id, attributes in self.graph.nodes(data=True)],
            "edges": [attributes for _, _, attributes in self.graph.edges(data=True)],
            "cases": [case.model_dump(mode="json") for case in self.cases.values()],
            "alerts": [alert.model_dump() for alert in self.alerts],
        }
        path.write_text(json.dumps(data), encoding="utf-8")

    def load(self, path: Path) -> None:
        data = json.loads(path.read_text(encoding="utf-8"))
        self.reset()
        self.graph.add_nodes_from((node.pop("id"), node) for node in data["nodes"])
        self.graph.add_edges_from((edge["source"], edge["target"], edge) for edge in data["edges"])
        self.cases = {case["id"]: Case.model_validate(case) for case in data["cases"]}
        self.alerts = [Alert.model_validate(alert) for alert in data["alerts"]]
