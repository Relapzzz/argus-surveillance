import type { CaseSummary, GraphNode, GraphResponse, Relationship } from '@/api/types'
import { plural } from '@/lib/format'

export interface Place {
  id: string
  label: string
  lat: number
  lon: number
  firs: CaseSummary[]
  residents: GraphNode[]
  calls: number
  people: GraphNode[]
  size: number
}
export interface PlaceReport { places: Place[]; unknownCells: number }

const city = 'Pune'
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const cellsOf = (edge: Relationship): string[] => {
  const cells = edge.attributes.cells
  return Array.isArray(cells) ? cells.filter((cell): cell is string => typeof cell === 'string' && cell !== '') : []
}
const push = <T>(index: Map<string, T[]>, key: string, value: T) => index.set(key, [...(index.get(key) ?? []), value])

export function describePlace(place: Place) {
  const parts = [
    place.firs.length ? plural(place.firs.length, 'FIR') : '',
    place.residents.length ? plural(place.residents.length, 'resident') : '',
    place.calls ? plural(place.calls, 'call') : '',
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Nothing recorded here yet'
}

export function aggregatePlaces(graph: GraphResponse, cases: CaseSummary[], entityId?: string): PlaceReport {
  const nodes = new Map(graph.nodes.map(node => [node.id, node]))
  const caseById = new Map(cases.map(item => [item.id, item]))
  const locations = graph.nodes.flatMap(node => {
    const lat = node.attributes.lat, lon = node.attributes.lon
    return node.type === 'location' && typeof lat === 'number' && typeof lon === 'number' ? [{ node, lat, lon }] : []
  })
  const identifiers = entityId
    ? new Set([entityId, ...graph.edges.filter(edge => edge.type === 'owns' && edge.source === entityId && ['phone', 'account'].includes(nodes.get(edge.target)?.type ?? '')).map(edge => edge.target)])
    : undefined

  const placeCases = new Map<string, string[]>()
  const casePeople = new Map<string, GraphNode[]>()
  const ownCases = new Set<string>()
  for (const edge of graph.edges) {
    if (edge.type !== 'mentioned_in' && edge.type !== 'seen_at') continue
    const from = nodes.get(edge.source), to = nodes.get(edge.target)
    if (!from || !to) continue
    const [other, record] = from.type === 'case' ? [to, from] : [from, to]
    if (record.type !== 'case') continue
    if (other.type === 'location') push(placeCases, other.id, record.id)
    if (other.type === 'person') push(casePeople, record.id, other)
    if (identifiers?.has(other.id)) ownCases.add(record.id)
  }

  const placeResidents = new Map<string, GraphNode[]>()
  for (const edge of graph.edges) {
    if (edge.type !== 'resides_at') continue
    const from = nodes.get(edge.source), to = nodes.get(edge.target)
    if (!from || !to) continue
    const [person, place] = from.type === 'location' ? [to, from] : [from, to]
    if (person.type !== 'person' || place.type !== 'location') continue
    if (identifiers && !identifiers.has(person.id)) continue
    push(placeResidents, place.id, person)
  }
  const byLength = locations.map(place => place.node).filter(place => place.label !== city).sort((a, b) => b.label.length - a.label.length)
  for (const person of graph.nodes) {
    if (person.type !== 'person' || (identifiers && !identifiers.has(person.id))) continue
    const address = person.attributes.address
    if (typeof address !== 'string') continue
    let rest = address
    for (const place of byLength) {
      const pattern = new RegExp(`\\b${escape(place.label)}\\b`, 'i')
      if (!pattern.test(rest)) continue
      rest = rest.replace(pattern, ' ')
      if (!placeResidents.get(place.id)?.some(resident => resident.id === person.id)) push(placeResidents, place.id, person)
    }
  }

  const idByLabel = new Map(locations.map(place => [place.node.label, place.node.id]))
  const placeCalls = new Map<string, number>()
  let unknownCells = 0
  for (const edge of graph.edges) {
    if (edge.type !== 'called') continue
    if (identifiers && !identifiers.has(edge.source) && !identifiers.has(edge.target)) continue
    for (const cell of cellsOf(edge)) {
      const id = idByLabel.get(cell)
      if (id) placeCalls.set(id, (placeCalls.get(id) ?? 0) + 1)
      else unknownCells++
    }
  }

  const places = locations.map(({ node, lat, lon }): Place => {
    const firs = [...new Set(placeCases.get(node.id) ?? [])]
      .filter(id => !identifiers || ownCases.has(id))
      .map(id => caseById.get(id))
      .filter((item): item is CaseSummary => item !== undefined)
      .sort((a, b) => a.fir_number.localeCompare(b.fir_number))
    const residents = placeResidents.get(node.id) ?? []
    const calls = placeCalls.get(node.id) ?? 0
    const people = [...new Map([...residents, ...firs.flatMap(item => casePeople.get(item.id) ?? [])].map(person => [person.id, person])).values()]
    return {
      id: node.id,
      label: node.label,
      lat,
      lon,
      firs,
      residents,
      calls,
      people,
      size: 3 * firs.length + residents.length + Math.log1p(calls),
    }
  })
  return {
    places: places.filter(place => !identifiers || place.firs.length || place.residents.length || place.calls).sort((a, b) => b.size - a.size),
    unknownCells,
  }
}
