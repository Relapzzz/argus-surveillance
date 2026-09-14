import type { EntityType, GraphFilters, GraphResponse } from '@/api/types'

export const palette: Record<EntityType, string> = { person: '#a7d7b6', phone: '#8bb9e5', vehicle: '#e2bc81', location: '#9f97d2', organization: '#dc97af', account: '#76c8c0', case: '#c1c5cb' }
export function filterGraph(graph: GraphResponse, filters: GraphFilters): GraphResponse {
  const nodes = graph.nodes.filter(n => (filters.types === undefined || filters.types.includes(n.type)) && (filters.community === undefined || n.metrics.community === filters.community) && n.metrics.degree >= (filters.min_degree ?? 0))
  const ids = new Set(nodes.map(n => n.id))
  return { nodes, edges: graph.edges.filter(e => ids.has(e.source) && ids.has(e.target)) }
}
export function mergeGraphs(a: GraphResponse, b: GraphResponse): GraphResponse {
  return { nodes: [...new Map([...a.nodes, ...b.nodes].map(n => [n.id, n])).values()], edges: [...new Map([...a.edges, ...b.edges].map(e => [e.id, e])).values()] }
}
export function networkUrl(ids: string[] = []) {
  const params = new URLSearchParams()
  ids.forEach(id => params.append('highlight', id))
  if (ids[0]) params.set('entity', ids[0])
  return '/network' + (params.size ? '?' + params : '')
}
