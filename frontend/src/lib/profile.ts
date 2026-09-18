import type { CaseSummary, GraphNode, GraphResponse, Relationship } from '@/api/types'

export interface Associate { node: GraphNode; community: number; count: number }
export interface Associates { coAccused: Associate[]; associates: Associate[]; called: Associate[]; money: Associate[] }
export interface PlaceLink { node: GraphNode; link: 'home' | 'seen' | 'FIR place' }
export interface Fir { case: CaseSummary; role?: string }
export interface Activity { calls: number; moneyIn: number; moneyOut: number; firstSeen?: string; lastSeen?: string }
interface Transfer { amount: number; ts: string; to: string }

const nodesById = (graph: GraphResponse) => new Map(graph.nodes.map(n => [n.id, n]))
const num = (value: unknown) => typeof value === 'number' ? value : 0
const str = (value: unknown) => typeof value === 'string' ? value : undefined
const transfersOf = (edge: Relationship) => Array.isArray(edge.attributes.transfers) ? edge.attributes.transfers as Transfer[] : []
const counterpart = (edge: Relationship, ids: Set<string>) => ids.has(edge.source) ? edge.target : ids.has(edge.target) ? edge.source : undefined

export function ownerOf(graph: GraphResponse, id: string) {
  const edge = graph.edges.find(e => e.type === 'owns' && e.target === id)
  return edge ? nodesById(graph).get(edge.source) : undefined
}

export function ownedBy(graph: GraphResponse, id: string) {
  const byId = nodesById(graph)
  return graph.edges.filter(e => e.type === 'owns' && e.source === id).flatMap(e => { const node = byId.get(e.target); return node ? [node] : [] })
}

export function identifiersOf(graph: GraphResponse, id: string) {
  return [id, ...ownedBy(graph, id).map(n => n.id)]
}

function caseRoles(graph: GraphResponse, ids: Set<string>) {
  const roles = new Map<string, string | undefined>()
  for (const edge of graph.edges) {
    if (edge.type !== 'mentioned_in') continue
    const [entity, caseId] = edge.target.startsWith('case:') ? [edge.source, edge.target] : [edge.target, edge.source]
    if (ids.has(entity)) roles.set(caseId, str(edge.attributes.role) ?? roles.get(caseId))
  }
  return roles
}

export function firsOf(graph: GraphResponse, cases: CaseSummary[], id: string): Fir[] {
  const roles = caseRoles(graph, new Set(identifiersOf(graph, id)))
  return cases.filter(c => roles.has(c.id)).map(c => ({ case: c, role: roles.get(c.id) }))
}

export function placesOf(graph: GraphResponse, id: string): PlaceLink[] {
  const byId = nodesById(graph)
  const ids = new Set(identifiersOf(graph, id))
  const found = new Map<string, PlaceLink>()
  const add = (node: GraphNode | undefined, link: PlaceLink['link']) => {
    if (node && node.type === 'location' && !found.has(node.id)) found.set(node.id, { node, link })
  }
  for (const edge of graph.edges) {
    if (edge.type !== 'resides_at' && edge.type !== 'seen_at') continue
    add(byId.get(counterpart(edge, ids) ?? ''), edge.type === 'resides_at' ? 'home' : 'seen')
  }
  const address = str(byId.get(id)?.attributes.address)
  if (address) {
    let rest = address.toLowerCase()
    const places = graph.nodes.filter(n => n.type === 'location' && n.label !== 'Pune').sort((a, b) => b.label.length - a.label.length)
    for (const place of places) {
      const at = rest.indexOf(place.label.toLowerCase())
      if (at === -1) continue
      rest = rest.slice(0, at) + rest.slice(at + place.label.length)
      add(place, 'home')
    }
  }
  const caseIds = caseRoles(graph, ids)
  for (const node of graph.nodes) if (node.sources.some(s => caseIds.has(s))) add(node, 'FIR place')
  return [...found.values()]
}

export function associatesOf(graph: GraphResponse, id: string): Associates {
  const byId = nodesById(graph)
  const ids = new Set(identifiersOf(graph, id))
  const owner = new Map(graph.edges.filter(e => e.type === 'owns').map(e => [e.target, e.source]))
  const coAccused = new Map<string, Associate>(), associates = new Map<string, Associate>(), called = new Map<string, Associate>(), money = new Map<string, Associate>()
  const push = (into: Map<string, Associate>, nodeId: string, count: number) => {
    const node = byId.get(nodeId)
    if (!node || ids.has(nodeId)) return
    const seen = into.get(nodeId)
    if (seen) seen.count += count
    else into.set(nodeId, { node, community: node.metrics.community, count })
  }
  for (const edge of graph.edges) {
    const other = counterpart(edge, ids)
    if (!other) continue
    if (edge.type === 'co_accused') push(coAccused, other, edge.weight)
    else if (edge.type === 'associate_of' || edge.type === 'member_of') push(associates, other, edge.weight)
    else if (edge.type === 'called') push(called, owner.get(other) ?? other, num(edge.attributes.count))
    else if (edge.type === 'transacted') push(money, owner.get(other) ?? other, num(edge.attributes.count))
  }
  const ranked = (from: Map<string, Associate>) => [...from.values()].sort((a, b) => b.count - a.count)
  return { coAccused: ranked(coAccused), associates: ranked(associates), called: ranked(called), money: ranked(money) }
}

export function activityOf(graph: GraphResponse, id: string): Activity {
  const ids = new Set(identifiersOf(graph, id))
  const times: string[] = []
  let calls = 0, moneyIn = 0, moneyOut = 0
  for (const edge of graph.edges) {
    if (edge.type !== 'called' && edge.type !== 'transacted') continue
    if (!counterpart(edge, ids)) continue
    if (edge.type === 'called') calls += num(edge.attributes.count)
    else for (const transfer of transfersOf(edge)) {
      if (ids.has(transfer.to)) moneyIn += transfer.amount
      else moneyOut += transfer.amount
    }
    const first = str(edge.attributes.first_seen), last = str(edge.attributes.last_seen)
    if (first) times.push(first)
    if (last) times.push(last)
  }
  times.sort()
  return { calls, moneyIn, moneyOut, firstSeen: times[0], lastSeen: times.at(-1) }
}
