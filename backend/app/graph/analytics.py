from bisect import bisect_left
from collections import Counter
from itertools import pairwise

import networkx as nx

from app.schemas import Community, KeyPlayer, PathResponse

RESOLUTION = 0.5
BRIDGE_PERCENTILE = 0.95
CONTEXT_TYPES = {"location"}
IDENTIFIER_TYPES = {"phone", "account", "vehicle"}


def actor_graph(G: nx.Graph) -> tuple[nx.Graph, dict[str, str]]:
    rep = {n: n for n, data in G.nodes(data=True) if data["type"] not in CONTEXT_TYPES}
    for _, _, data in G.edges(data=True):
        if data["type"] == "owns" and G.nodes[data["target"]]["type"] in IDENTIFIER_TYPES:
            rep[data["target"]] = data["source"]
    H = nx.Graph()
    H.add_nodes_from(set(rep.values()))
    H.add_edges_from((rep[a], rep[b]) for a, b in G.edges if a in rep and b in rep and rep[a] != rep[b])
    return H, rep


def compute_metrics(G: nx.Graph) -> None:
    H, rep = actor_graph(G)
    betweenness, pagerank = nx.betweenness_centrality(H), nx.pagerank(H)
    groups = sorted(nx.community.louvain_communities(H, resolution=RESOLUTION, seed=42), key=lambda c: (-len(c), min(c)))
    community = {n: i for i, members in enumerate(groups) for n in members}
    for id, data in G.nodes(data=True):
        if id in rep:
            actor = rep[id]
            data["metrics"] = {"degree": H.degree(actor), "betweenness": betweenness[actor], "pagerank": pagerank[actor], "community": community[actor]}
        else:
            nearby = Counter(community[rep[n]] for n in G[id] if n in rep)
            data["metrics"] = {"degree": G.degree(id), "betweenness": 0.0, "pagerank": 0.0, "community": nearby.most_common(1)[0][0]}


def listed(items) -> str:
    words = list(map(str, items))
    return " and ".join(words) if len(words) < 3 else f"{', '.join(words[:-1])} and {words[-1]}"


def percentile(values: list[float], value: float) -> float:
    return bisect_left(values, value) / len(values)


def key_players(G: nx.Graph, limit: int = 10) -> list[KeyPlayer]:
    H, _ = actor_graph(G)
    persons = {id: data["metrics"] for id, data in G.nodes(data=True) if data["type"] == "person"}
    ranked = {name: sorted(m[name] for m in persons.values()) for name in ("pagerank", "betweenness", "degree")}
    players = []
    for id, metrics in persons.items():
        pct = {name: percentile(values, metrics[name]) for name, values in ranked.items()}
        score = 0.4 * pct["pagerank"] + 0.4 * pct["betweenness"] + 0.2 * pct["degree"]
        players.append(KeyPlayer(entity_id=id, label=G.nodes[id]["label"], score=round(score, 4), **metrics, reason=reason(G, H, id, pct["betweenness"])))
    return sorted(players, key=lambda p: -p.score)[:limit]


def reason(G: nx.Graph, H: nx.Graph, id: str, betweenness_pct: float) -> str:
    metrics = G.nodes[id]["metrics"]
    spanned = sorted({G.nodes[n]["metrics"]["community"] for n in H[id]})
    if betweenness_pct >= BRIDGE_PERCENTILE and len(spanned) > 1:
        return f"bridges communities {listed(spanned)}"
    peers = [d["metrics"]["degree"] for _, d in G.nodes(data=True) if d["type"] == "person" and d["metrics"]["community"] == metrics["community"]]
    if metrics["degree"] == max(peers):
        return f"most connected in community {metrics['community']}"
    return f"high influence in community {metrics['community']}"


def communities(G: nx.Graph) -> list[Community]:
    groups: dict[int, list[str]] = {}
    for id, data in G.nodes(data=True):
        groups.setdefault(data["metrics"]["community"], []).append(id)
    return [
        Community(id=c, size=len(members), member_ids=members, top_member=max(members, key=lambda n: G.nodes[n]["metrics"]["pagerank"]))
        for c, members in sorted(groups.items())
    ]


def shortest_path(G: nx.Graph, source: str, target: str) -> PathResponse:
    view = G.subgraph(n for n, data in G.nodes(data=True) if data["type"] != "case" or n in (source, target))
    node_ids = nx.shortest_path(view, source, target)
    return PathResponse(node_ids=node_ids, edge_ids=[G.edges[a, b]["id"] for a, b in pairwise(node_ids)])


def ego(G: nx.Graph, id: str, depth: int = 1) -> nx.Graph:
    return nx.ego_graph(G, id, radius=depth)
