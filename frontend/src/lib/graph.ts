import type { EntityType, GraphFilters, GraphResponse } from '@/api/types'

export const palette: Record<EntityType, string> = { person: '#f3ead8', phone: '#5fc3ff', vehicle: '#b79cff', location: '#ff8da1', organization: '#4dd4c6', account: '#5fd39a', case: '#7d8794' }
export const paperPalette: Record<EntityType, string> = { person: '#b07a1a', phone: '#1d7fc4', vehicle: '#6f45e6', location: '#d1466d', organization: '#0f8f84', account: '#1e9a5c', case: '#6b7684' }
export const typeNames: Record<EntityType, string> = { person: 'Person', phone: 'Phone', vehicle: 'Vehicle', location: 'Place', organization: 'Organization', account: 'Account', case: 'FIR' }
const groupHues = ['#4f9cff', '#ff7a5c', '#7ed957', '#c98bff', '#ffd166', '#3dd6c9', '#ff9ecf', '#a3b18a']
export const groupColor = (id: number) => groupHues[Math.abs(id) % groupHues.length]
export const humanize = (text: string) => text.replace(/communities/g, 'groups').replace(/community/g, 'group')
export function labelFromId(id: string) {
  const at = id.indexOf(':')
  const type = id.slice(0, at), rest = id.slice(at + 1)
  return ['person', 'location', 'organization'].includes(type) ? rest.replace(/(^|\s)\p{L}/gu, c => c.toUpperCase()) : rest
}
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
