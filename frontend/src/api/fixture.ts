import raw from '@/fixtures/graph.json'
import { ApiError } from './errors'
import { entityTypes } from './types'
import type { Alert, CaseDetail, Community, EntityDetail, GraphFilters, GraphNode, GraphResponse, KeyPlayer, PathResponse, Stats } from './types'

const graph = raw as unknown as GraphResponse & { alerts: Alert[]; cases: Omit<CaseDetail, 'entity_count'>[] }
const cases: CaseDetail[] = graph.cases.map(c => ({ ...c, entity_count: new Set(c.entities.map(e => e.id)).size }))
const byId = new Map(graph.nodes.map(n => [n.id, n]))
const owner = new Map(graph.edges.filter(e => e.type === 'owns').map(e => [e.target, e.source]))
const subgraph = (ids: Set<string>): GraphResponse => structuredClone({ nodes: graph.nodes.filter(n => ids.has(n.id)), edges: graph.edges.filter(e => ids.has(e.source) && ids.has(e.target)) })
const node = (id: string) => {
  const found = byId.get(id)
  if (!found) throw new ApiError(404, 'Entity not found.')
  return found
}
const neighbors = (id: string) => graph.edges.filter(e => e.source === id || e.target === id).map(e => ({ edge: e, node: node(e.source === id ? e.target : e.source) }))
const listed = (items: number[]) => items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
const percentile = (sorted: number[], value: number) => { const at = sorted.findIndex(v => v >= value); return (at === -1 ? sorted.length : at) / sorted.length }

function actorNeighbors(person: GraphNode) {
  const own = [person.id, ...graph.edges.filter(e => e.type === 'owns' && e.source === person.id).map(e => e.target)]
  const set = new Set<string>()
  for (const id of own) for (const { node: n } of neighbors(id)) {
    const actor = owner.get(n.id) ?? n.id
    if (actor !== person.id && n.type !== 'location') set.add(actor)
  }
  return [...set].map(id => node(id))
}

export const fixture = {
  graph(filters: GraphFilters = {}): GraphResponse {
    return subgraph(new Set(graph.nodes.filter(n => (!filters.types?.length || filters.types.includes(n.type)) && (filters.community === undefined || n.metrics.community === filters.community) && n.metrics.degree >= (filters.min_degree ?? 0)).map(n => n.id)))
  },
  stats(): Stats {
    return { entities: Object.fromEntries(entityTypes.map(t => [t, graph.nodes.filter(n => n.type === t).length])) as Stats['entities'], relationships: graph.edges.length, cases: cases.length, alerts: graph.alerts.length }
  },
  entity(id: string): EntityDetail {
    const { metrics, ...entity } = node(id)
    return structuredClone({ entity, metrics, sources: entity.sources, neighbors: neighbors(id).map(({ node: n, edge }) => ({ id: n.id, type: n.type, label: n.label, relationship: edge.type, edge_id: edge.id })) })
  },
  ego(id: string, depth = 1): GraphResponse {
    node(id)
    const ids = new Set([id])
    let frontier = [id]
    for (let i = 0; i < depth; i++) {
      frontier = frontier.flatMap(n => neighbors(n).map(({ node: n }) => n.id)).filter(n => !ids.has(n))
      frontier.forEach(n => ids.add(n))
    }
    return subgraph(ids)
  },
  keyPlayers(limit = 10): KeyPlayer[] {
    const persons = graph.nodes.filter(n => n.type === 'person')
    const ranked = { pagerank: persons.map(p => p.metrics.pagerank).sort((a, b) => a - b), betweenness: persons.map(p => p.metrics.betweenness).sort((a, b) => a - b), degree: persons.map(p => p.metrics.degree).sort((a, b) => a - b) }
    return persons.map((p): KeyPlayer => {
      const pct = { pagerank: percentile(ranked.pagerank, p.metrics.pagerank), betweenness: percentile(ranked.betweenness, p.metrics.betweenness), degree: percentile(ranked.degree, p.metrics.degree) }
      const spanned = [...new Set(actorNeighbors(p).map(n => n.metrics.community))].sort((a, b) => a - b)
      const peers = persons.filter(q => q.metrics.community === p.metrics.community).map(q => q.metrics.degree)
      const reason = pct.betweenness >= 0.95 && spanned.length > 1 ? `bridges communities ${listed(spanned)}` : p.metrics.degree === Math.max(...peers) ? `most connected in community ${p.metrics.community}` : `high influence in community ${p.metrics.community}`
      return { entity_id: p.id, label: p.label, score: Math.round((0.4 * pct.pagerank + 0.4 * pct.betweenness + 0.2 * pct.degree) * 1e4) / 1e4, ...p.metrics, reason }
    }).sort((a, b) => b.score - a.score).slice(0, limit)
  },
  communities(): Community[] {
    return [...new Set(graph.nodes.map(n => n.metrics.community))].sort((a, b) => a - b).map(id => {
      const members = graph.nodes.filter(n => n.metrics.community === id)
      return { id, size: members.length, member_ids: members.map(n => n.id), top_member: [...members].sort((a, b) => b.metrics.pagerank - a.metrics.pagerank)[0].id }
    })
  },
  alerts: (): Alert[] => structuredClone(graph.alerts),
  cases: () => cases.map(({ narrative, entities, ...summary }) => summary),
  case(id: string): CaseDetail {
    const found = cases.find(c => c.id === id)
    if (!found) throw new ApiError(404, 'Case not found.')
    return structuredClone(found)
  },
  path(source: string, target: string): PathResponse {
    node(source); node(target)
    const allowed = (n: GraphNode) => n.type !== 'case' || n.id === source || n.id === target
    const parents = new Map<string, { id: string; edge: string } | null>([[source, null]])
    const queue = [source]
    for (let i = 0; i < queue.length && !parents.has(target); i++) {
      for (const { node: n, edge } of neighbors(queue[i])) {
        if (allowed(n) && !parents.has(n.id)) { parents.set(n.id, { id: queue[i], edge: edge.id }); queue.push(n.id) }
      }
    }
    if (!parents.has(target)) throw new ApiError(404, 'These entities are not connected.')
    const node_ids = [target], edge_ids: string[] = []
    for (let id = target; parents.get(id);) {
      const parent = parents.get(id)!
      edge_ids.unshift(parent.edge); node_ids.unshift(parent.id); id = parent.id
    }
    return { node_ids, edge_ids }
  },
}
