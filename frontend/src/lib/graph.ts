import type { EntityType, GraphFilters, GraphResponse } from '@/api/types'
import { listed } from './format'

export const palette: Record<EntityType, string> = { person: '#132238', phone: '#1971C2', vehicle: '#6741D9', location: '#C2255C', organization: '#0C8599', account: '#2B8A3E', case: '#868E96' }
export const typeNames: Record<EntityType, string> = { person: 'Person', phone: 'Phone', vehicle: 'Vehicle', location: 'Place', organization: 'Organization', account: 'Account', case: 'FIR' }
const groupHues = ['#3B6BC4', '#D9480F', '#2F9E44', '#7048E8', '#B8860B', '#0CA678', '#D6336C', '#5F6B7A']
export const groupColor = (id: number) => groupHues[Math.abs(id) % groupHues.length]

export function groupNames(graph: GraphResponse): Map<number, string> {
  const nodes = new Map(graph.nodes.map(n => [n.id, n]))
  const tally = new Map<number, Map<string, number>>()
  for (const e of graph.edges) {
    if (e.type !== 'resides_at') continue
    const a = nodes.get(e.source), b = nodes.get(e.target)
    if (!a || !b) continue
    const [person, place] = a.type === 'location' ? [b, a] : [a, b]
    if (person.type !== 'person' || place.type !== 'location' || place.label === 'Pune') continue
    const counts = tally.get(person.metrics.community) ?? new Map<string, number>()
    counts.set(place.label, (counts.get(place.label) ?? 0) + 1)
    tally.set(person.metrics.community, counts)
  }
  const names = new Map<number, string>()
  for (const id of new Set(graph.nodes.map(n => n.metrics.community))) {
    const top = [...(tally.get(id) ?? [])].sort((a, b) => b[1] - a[1])[0]
    names.set(id, top ? `${top[0]} group` : `Group ${id}`)
  }
  return names
}
export const groupName = (names: Map<number, string> | undefined, id: number) => names?.get(id) ?? `Group ${id}`

export function humanize(text: string, names?: Map<number, string>) {
  const name = (n: string) => { const found = names?.get(Number(n)); return found && !found.startsWith('Group ') ? `the ${found}` : `group ${n}` }
  return text
    .replace(/communities ((?:\d+(?:, | and ))*\d+)/g, (_, list: string) => listed(list.split(/, | and /).map(name)))
    .replace(/community (\d+)/g, (_, n: string) => name(n))
    .replace(/\bRs (?=\d)/g, '₹')
}
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
export const profileUrl = (id: string) => '/entity/' + encodeURIComponent(id)
export const caseUrl = (id: string) => '/cases?' + new URLSearchParams({ case: id })
export const timelineUrl = (entity: string, withId?: string) => '/timeline?' + new URLSearchParams(withId ? { entity, with: withId } : { entity })
export const mapUrl = (entity?: string) => entity ? '/map?' + new URLSearchParams({ entity }) : '/map'
export const routeUrl = (from: string, to: string) => '/network?' + new URLSearchParams({ tab: 'route', from, to })
