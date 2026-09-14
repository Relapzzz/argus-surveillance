import raw from '@/fixtures/graph.json'
import { ApiError } from './errors'
import { entityTypes } from './types'
import type { Alert, CaseDetail, Community, EntityDetail, GraphFilters, GraphResponse, KeyPlayer, PathResponse, Stats } from './types'

const graph = raw as unknown as GraphResponse & { alerts: Alert[]; cases: Omit<CaseDetail, 'entity_count'>[] }
const cases: CaseDetail[] = graph.cases.map(c => ({ ...c, entity_count: new Set(c.entities.map(e => e.id)).size }))
const subgraph = (ids: Set<string>): GraphResponse => structuredClone({ nodes: graph.nodes.filter(n => ids.has(n.id)), edges: graph.edges.filter(e => ids.has(e.source) && ids.has(e.target)) })
const node = (id: string) => {
  const found = graph.nodes.find(n => n.id === id)
  if (!found) throw new ApiError(404, 'Entity not found.')
  return found
}
const neighbors = (id: string) => graph.edges.filter(e => e.source === id || e.target === id).map(e => ({ edge: e, node: node(e.source === id ? e.target : e.source) }))

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
    return graph.nodes.filter(n => n.type === 'person').sort((a, b) => b.metrics.pagerank - a.metrics.pagerank).slice(0, limit).map(n => ({ entity_id: n.id, label: n.label, score: n.metrics.pagerank, ...n.metrics, reason: `PageRank ${n.metrics.pagerank.toFixed(3)} with ${n.metrics.degree} connections in community ${n.metrics.community}` }))
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
    const parents = new Map<string, { id: string; edge: string } | null>([[source, null]])
    const queue = [source]
    for (let i = 0; i < queue.length && !parents.has(target); i++) {
      for (const { node: n, edge } of neighbors(queue[i])) {
        if (!parents.has(n.id)) { parents.set(n.id, { id: queue[i], edge: edge.id }); queue.push(n.id) }
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
