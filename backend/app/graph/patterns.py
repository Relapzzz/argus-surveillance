import re
from datetime import datetime, timedelta
from statistics import median

import networkx as nx

from app.graph.analytics import actor_graph, listed
from app.schemas import Alert

BURST_CALLS, BURST_WINDOW = 8, timedelta(hours=1)
STRUCTURING_COUNT, STRUCTURING_RANGE, STRUCTURING_WINDOW = 5, (40000, 49999), timedelta(days=7)
NIGHT_CALLS, NIGHT_SHARE, NIGHT_HOURS = 10, 0.7, range(0, 4)
BRIDGE_TOP_PERCENT = 5


def detect(G: nx.Graph) -> list[Alert]:
    return [*burst_calls(G), *structuring(G), *bridge_nodes(G), *night_calls(G)]


def inr(amount: int) -> str:
    return "Rs " + re.sub(r"(?<=\d)(?=(?:\d\d)*\d{3}$)", ",", str(amount))


def owner(G: nx.Graph, id: str) -> str | None:
    return next((n for n in G[id] if G.nodes[n]["type"] == "person" and G.edges[id, n]["type"] == "owns"), None)


def describe(G: nx.Graph, id: str) -> str:
    data = G.nodes[id]
    text = data["label"] if data["type"] == "person" else f"{data['type']} {data['label']}"
    who = owner(G, id)
    return f"{text} ({G.nodes[who]['label']})" if who else text


def with_owners(G: nx.Graph, ids: list[str]) -> list[str]:
    owners = [owner(G, id) for id in ids]
    return list(dict.fromkeys([*ids, *(o for o in owners if o)]))


def window(events: list, key, span: timedelta) -> tuple[int, int, int]:
    best, j = (0, 0, 0), 0
    for i, event in enumerate(events):
        while j < len(events) and key(events[j]) - key(event) <= span:
            j += 1
        if j - i > best[0]:
            best = (j - i, i, j)
    return best


def stamps(G: nx.Graph, a: str, b: str) -> list[datetime]:
    return sorted(datetime.fromisoformat(t) for t in G.edges[a, b]["attributes"].get("timestamps", []))


def burst_calls(G: nx.Graph) -> list[Alert]:
    alerts = []
    for a, b, data in G.edges(data=True):
        calls = stamps(G, a, b)
        count, i, j = window(calls, lambda t: t, BURST_WINDOW)
        if count < BURST_CALLS:
            continue
        start, end = calls[i], calls[j - 1]
        alerts.append(Alert(
            id=f"alert:burst_calls:{data['id']}",
            type="burst_calls",
            severity="high",
            title=f"{count} calls between {G.nodes[a]['label']} and {G.nodes[b]['label']} within an hour",
            description=f"{describe(G, a)} and {describe(G, b)} exchanged {count} calls between {start:%H:%M} and {end:%H:%M} on {start:%d %B %Y}, out of {len(calls)} calls between the pair in total.",
            entity_ids=with_owners(G, [a, b]),
            evidence={"count": count, "window_minutes": int((end - start).total_seconds() // 60), "start": start.isoformat(), "end": end.isoformat()},
        ))
    return alerts


def structuring(G: nx.Graph) -> list[Alert]:
    alerts = []
    low, high = STRUCTURING_RANGE
    for id, data in G.nodes(data=True):
        if data["type"] != "account":
            continue
        events = sorted(
            (datetime.fromisoformat(t["ts"]), t["amount"], other, t["to"] == id)
            for other in G[id]
            for t in G.edges[id, other]["attributes"].get("transfers", [])
        )
        incoming = [e for e in events if e[3] and low <= e[1] <= high]
        count, i, j = window(incoming, lambda e: e[0], STRUCTURING_WINDOW)
        if count < STRUCTURING_COUNT:
            continue
        hits = incoming[i:j]
        amounts = [amount for _, amount, _, _ in hits]
        senders = list(dict.fromkeys(sender for _, _, sender, _ in hits))
        ids = [id, *senders]
        description = (
            f"{len(senders)} accounts sent {count} transfers of {inr(min(amounts))} to {inr(max(amounts))} into {describe(G, id)} "
            f"between {hits[0][0]:%d %B} and {hits[-1][0]:%d %B %Y}, totalling {inr(sum(amounts))}, every one below the {inr(high + 1)} reporting threshold."
        )
        evidence = {"count": count, "total_amount": sum(amounts), "min_amount": min(amounts), "max_amount": max(amounts), "threshold": high + 1, "window_days": STRUCTURING_WINDOW.days, "start": hits[0][0].isoformat(), "end": hits[-1][0].isoformat()}
        forward = max((e for e in events if not e[3] and e[0] > hits[0][0]), key=lambda e: e[1], default=None)
        if forward:
            description += f" {inr(forward[1])} moved on to {describe(G, forward[2])} on {forward[0]:%d %B %Y}."
            evidence |= {"forwarded_to": forward[2], "forwarded_amount": forward[1]}
            ids.append(forward[2])
        alerts.append(Alert(
            id=f"alert:structuring:{id}",
            type="structuring",
            severity="high",
            title=f"{count} transfers just under {inr(high + 1)} into {describe(G, id)} within a week",
            description=description,
            entity_ids=with_owners(G, ids),
            evidence=evidence,
        ))
    return alerts


def bridge_nodes(G: nx.Graph) -> list[Alert]:
    H, rep = actor_graph(G)
    if not H:
        return []
    metrics = {id: G.nodes[id]["metrics"] for id in H}
    ranked = sorted(m["betweenness"] for m in metrics.values())
    cutoff = ranked[len(ranked) * (100 - BRIDGE_TOP_PERCENT) // 100]
    typical = median(m["degree"] for m in metrics.values())
    alerts = []
    for id, m in metrics.items():
        if m["betweenness"] < cutoff or m["betweenness"] == 0 or m["degree"] >= typical:
            continue
        owned = [n for n, actor in rep.items() if actor == id and n != id]
        spanned = sorted({metrics[n]["community"] for n in H[id]} | {m["community"]})
        identifiers = ", ".join(f"{G.nodes[n]['type']} {G.nodes[n]['label']}" for n in owned)
        alerts.append(Alert(
            id=f"alert:bridge_node:{id}",
            type="bridge_node",
            severity="medium",
            title=f"{describe(G, id)} bridges the network with only {m['degree']} connections",
            description=(
                f"{describe(G, id)} has {m['degree']} connections, below the network median of {typical:g}, yet lies on more shortest paths than "
                f"{100 - BRIDGE_TOP_PERCENT} percent of all actors. It touches communities {listed(spanned)} through "
                f"{', '.join(describe(G, n) for n in H[id])}{' using ' + identifiers if identifiers else ''}."
            ),
            entity_ids=[id, *owned, *H[id]],
            evidence={"betweenness": m["betweenness"], "degree": m["degree"], "median_degree": typical, "communities": spanned},
        ))
    return alerts


def night_calls(G: nx.Graph) -> list[Alert]:
    alerts = []
    for id, data in G.nodes(data=True):
        if data["type"] != "phone":
            continue
        calls = sorted((t, other) for other in G[id] for t in stamps(G, id, other))
        night = [(t, other) for t, other in calls if t.hour in NIGHT_HOURS]
        if len(calls) < NIGHT_CALLS or len(night) / len(calls) <= NIGHT_SHARE:
            continue
        counterparts = list(dict.fromkeys(other for _, other in night))
        alerts.append(Alert(
            id=f"alert:night_calls:{id}",
            type="night_calls",
            severity="medium",
            title=f"{len(night)} of {len(calls)} calls on {describe(G, id)} fall between midnight and 4 am",
            description=(
                f"{describe(G, id)} made or received {len(calls)} calls between {calls[0][0]:%d %B} and {calls[-1][0]:%d %B %Y}, "
                f"{len(night)} of them between 00:00 and 04:00, with {', '.join(describe(G, c) for c in counterparts)}."
            ),
            entity_ids=with_owners(G, [id, *counterparts]),
            evidence={"count": len(calls), "night_count": len(night), "night_window": "00:00-04:00", "first_seen": calls[0][0].isoformat(), "last_seen": calls[-1][0].isoformat()},
        ))
    return alerts
