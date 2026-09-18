import json
from pathlib import Path
from typing import Any

import networkx as nx
from neo4j import GraphDatabase

from app.config import settings
from app.graph import analytics, patterns
from app.schemas import Alert, Case, Entity, EntityDetail, GraphNode, GraphResponse, Neighbor, PathResponse, Relationship

METRIC_NAMES = ("degree", "betweenness", "pagerank", "community")


def to_response(G: nx.Graph) -> GraphResponse:
    return GraphResponse(
        nodes=[GraphNode(id=id, **data) for id, data in G.nodes(data=True)],
        edges=[Relationship(**data) for _, _, data in G.edges(data=True)],
    )


def node_data(props: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    id = props.pop("id")
    metrics = {name: props.pop(name) for name in METRIC_NAMES}
    return id, {**props, "attributes": json.loads(props["attributes"]), "metrics": metrics}


def edge_data(props: dict[str, Any]) -> dict[str, Any]:
    return {**props, "attributes": json.loads(props["attributes"])}


class Store:
    def __init__(self) -> None:
        self.graph = nx.Graph()
        self.cases: dict[str, Case] = {}
        self.alerts: list[Alert] = []

    def reset(self) -> None:
        Store.__init__(self)

    def close(self) -> None:
        pass

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

    def entity(self, id: str) -> EntityDetail | None:
        if id not in self.graph:
            return None
        data = self.graph.nodes[id]
        neighbors = [
            Neighbor(
                id=other,
                type=self.graph.nodes[other]["type"],
                label=self.graph.nodes[other]["label"],
                relationship=edge["type"],
                edge_id=edge["id"],
            )
            for other, edge in self.graph[id].items()
        ]
        return EntityDetail(entity={"id": id, **data}, metrics=data["metrics"], neighbors=neighbors, sources=data["sources"])

    def ego(self, id: str, depth: int = 1) -> GraphResponse | None:
        if id not in self.graph:
            return None
        return to_response(analytics.ego(self.graph, id, depth))

    def path(self, source: str, target: str) -> PathResponse | None:
        try:
            return analytics.shortest_path(self.graph, source, target)
        except (nx.NodeNotFound, nx.NetworkXNoPath):
            return None


class Neo4jStore(Store):
    def __init__(self) -> None:
        self.driver = GraphDatabase.driver(settings.neo4j_uri, auth=(settings.neo4j_user, settings.neo4j_password))
        super().__init__()
        self.run("CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE")

    def run(self, query: str, **params: Any) -> list[Any]:
        records, _, _ = self.driver.execute_query(query, database_="neo4j", **params)
        return records

    def close(self) -> None:
        self.driver.close()

    def reset(self) -> None:
        super().reset()
        self.run("MATCH (n) DETACH DELETE n")

    def recompute(self) -> None:
        super().recompute()
        self.push()

    def load(self, path: Path) -> None:
        super().load(path)
        self.push()

    def pull(self) -> None:
        for record in self.run("MATCH (n:Entity) RETURN n"):
            id, data = node_data(dict(record["n"]))
            self.graph.add_node(id, **data)
        for record in self.run("MATCH (:Entity)-[r]->(:Entity) RETURN r"):
            data = edge_data(dict(record["r"]))
            self.graph.add_edge(data["source"], data["target"], **data)
        for record in self.run("MATCH (c:CaseRecord) RETURN c.data AS data"):
            case = Case.model_validate_json(record["data"])
            self.cases[case.id] = case
        self.alerts = [Alert.model_validate_json(record["data"]) for record in self.run("MATCH (a:Alert) RETURN a.data AS data")]

    def push(self) -> None:
        nodes = [
            {
                "id": id,
                "kind": data["type"].capitalize(),
                "props": {
                    "id": id,
                    "type": data["type"],
                    "label": data["label"],
                    "sources": data["sources"],
                    "attributes": json.dumps(data["attributes"]),
                    **data["metrics"],
                },
            }
            for id, data in self.graph.nodes(data=True)
        ]
        self.run("UNWIND $rows AS row MERGE (n:Entity {id: row.id}) SET n = row.props SET n:$(row.kind)", rows=nodes)
        edges = [
            {
                "source": data["source"],
                "target": data["target"],
                "kind": data["type"].upper(),
                "props": {
                    "id": data["id"],
                    "source": data["source"],
                    "target": data["target"],
                    "type": data["type"],
                    "weight": data["weight"],
                    "sources": data["sources"],
                    "attributes": json.dumps(data["attributes"]),
                },
            }
            for _, _, data in self.graph.edges(data=True)
        ]
        self.run(
            "UNWIND $rows AS row MATCH (a:Entity {id: row.source}), (b:Entity {id: row.target}) "
            "MERGE (a)-[r:$(row.kind) {id: row.props.id}]-(b) SET r = row.props",
            rows=edges,
        )
        self.run(
            "UNWIND $rows AS row MERGE (c:CaseRecord {id: row.id}) SET c.data = row.data",
            rows=[{"id": id, "data": case.model_dump_json()} for id, case in self.cases.items()],
        )
        self.run("MATCH (a:Alert) DELETE a")
        self.run(
            "UNWIND $rows AS row CREATE (:Alert {id: row.id, data: row.data})",
            rows=[{"id": alert.id, "data": alert.model_dump_json()} for alert in self.alerts],
        )

    def entity(self, id: str) -> EntityDetail | None:
        records = self.run(
            "MATCH (n:Entity {id: $id}) OPTIONAL MATCH (n)-[r]-(m:Entity) RETURN n, collect(m) AS neighbours, collect(r) AS edges",
            id=id,
        )
        if not records:
            return None
        record = records[0]
        node_id, data = node_data(dict(record["n"]))
        neighbors = [
            Neighbor(id=m["id"], type=m["type"], label=m["label"], relationship=r["type"], edge_id=r["id"])
            for m, r in zip(record["neighbours"], record["edges"])
        ]
        return EntityDetail(entity={"id": node_id, **data}, metrics=data["metrics"], neighbors=neighbors, sources=data["sources"])

    def ego(self, id: str, depth: int = 1) -> GraphResponse | None:
        ids = {id}
        frontier = [id]
        for _ in range(depth):
            found = self.run("MATCH (n:Entity)-[]-(m:Entity) WHERE n.id IN $ids RETURN DISTINCT m.id AS id", ids=frontier)
            frontier = [record["id"] for record in found if record["id"] not in ids]
            ids.update(frontier)
        members = list(ids)
        nodes = self.run("MATCH (n:Entity) WHERE n.id IN $ids RETURN n", ids=members)
        if not nodes:
            return None
        G = nx.Graph()
        for record in nodes:
            node_id, data = node_data(dict(record["n"]))
            G.add_node(node_id, **data)
        for record in self.run("MATCH (a:Entity)-[r]->(b:Entity) WHERE a.id IN $ids AND b.id IN $ids RETURN r", ids=members):
            data = edge_data(dict(record["r"]))
            G.add_edge(data["source"], data["target"], **data)
        return to_response(G)

    def path(self, source: str, target: str) -> PathResponse | None:
        records = self.run(
            "MATCH (a:Entity {id: $source}), (b:Entity {id: $target}) MATCH p = shortestPath((a)-[*0..]-(b)) "
            "WHERE none(n IN nodes(p) WHERE n.type = 'case' AND NOT n.id IN [$source, $target]) "
            "RETURN [n IN nodes(p) | n.id] AS node_ids, [r IN relationships(p) | r.id] AS edge_ids",
            source=source,
            target=target,
        )
        if not records:
            return None
        return PathResponse(node_ids=records[0]["node_ids"], edge_ids=records[0]["edge_ids"])
