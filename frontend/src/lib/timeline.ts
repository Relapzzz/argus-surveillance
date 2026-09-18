import type { EntityType, GraphNode, GraphResponse } from '@/api/types'
import { formatLabel, parseTime } from './format'

export type EventKind = 'call' | 'transfer' | 'fir'
export interface CallEvent { kind: 'call'; at: Date; counterpart: string; via: string; cell: string }
export interface TransferEvent { kind: 'transfer'; at: Date; counterpart: string; via: string; amount: number; direction: 'in' | 'out' }
export interface FirEvent { kind: 'fir'; at: Date; caseId: string; firNumber: string; station: string }
export type TimelineEvent = CallEvent | TransferEvent | FirEvent
export type ContactEvent = CallEvent | TransferEvent
export interface Lane { id: string; label: string; type: EntityType; group: number; calls: number; transfers: number; events: ContactEvent[] }

interface CallAttributes { timestamps?: string[]; cells?: string[] }
interface TransferAttributes { transfers?: { amount: number; ts: string; to: string }[] }
interface CaseAttributes { fir_number: string; station: string; incident_time: string | null }

const monthFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })

const owners = (graph: GraphResponse) => new Map(graph.edges.filter(e => e.type === 'owns').map(e => [e.target, e.source]))
function identifiersOf(graph: GraphResponse, id: string) {
  return [id, ...graph.edges.filter(e => e.type === 'owns' && e.source === id).map(e => e.target)]
}

export const dayKey = (at: Date) => dayFormat.format(at)
export const dayStart = (day: string) => new Date(day + 'T00:00:00+05:30')
export const monthStart = (at: Date) => new Date(monthFormat.format(at) + '-01T00:00:00+05:30')
export function monthAfter(at: Date) {
  const [year, month] = monthFormat.format(at).split('-').map(Number)
  return new Date(`${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}-01T00:00:00+05:30`)
}

export function actors(graph: GraphResponse) {
  const nodes = new Map(graph.nodes.map(n => [n.id, n]))
  const own = owners(graph)
  return (id: string) => nodes.get(own.get(id) ?? id) as GraphNode
}

export function buildEvents(graph: GraphResponse, id: string): TimelineEvent[] {
  const mine = new Set(identifiersOf(graph, id))
  const nodes = new Map(graph.nodes.map(n => [n.id, n]))
  const events: TimelineEvent[] = []
  for (const edge of graph.edges) {
    const ours = mine.has(edge.source)
    if (!ours && !mine.has(edge.target)) continue
    const via = ours ? edge.source : edge.target
    const counterpart = ours ? edge.target : edge.source
    if (edge.type === 'called') {
      const { timestamps = [], cells = [] } = edge.attributes as CallAttributes
      timestamps.forEach((ts, at) => events.push({ kind: 'call', at: parseTime(ts), counterpart, via, cell: cells[at] ?? '' }))
    } else if (edge.type === 'transacted') {
      const { transfers = [] } = edge.attributes as TransferAttributes
      for (const transfer of transfers) events.push({ kind: 'transfer', at: parseTime(transfer.ts), counterpart, via, amount: transfer.amount, direction: mine.has(transfer.to) ? 'in' : 'out' })
    } else if (edge.type === 'mentioned_in') {
      const node = nodes.get(counterpart)
      if (node?.type !== 'case') continue
      const { fir_number, station, incident_time } = node.attributes as unknown as CaseAttributes
      if (incident_time) events.push({ kind: 'fir', at: parseTime(incident_time), caseId: node.id, firNumber: fir_number, station })
    }
  }
  return events.sort((a, b) => a.at.getTime() - b.at.getTime())
}

export function lanes(graph: GraphResponse, events: TimelineEvent[], withId?: string): Lane[] {
  const actorOf = actors(graph)
  const keep = withId ? new Set(identifiersOf(graph, withId)) : undefined
  const found = new Map<string, Lane>()
  for (const event of events) {
    if (event.kind === 'fir') continue
    const node = actorOf(event.counterpart)
    if (keep && !keep.has(node.id)) continue
    let lane = found.get(node.id)
    if (!lane) {
      lane = { id: node.id, label: formatLabel(node.type, node.label), type: node.type, group: node.metrics.community, calls: 0, transfers: 0, events: [] }
      found.set(node.id, lane)
    }
    lane.events.push(event)
    if (event.kind === 'call') lane.calls++
    else lane.transfers++
  }
  return [...found.values()].sort((a, b) => b.events.length - a.events.length)
}

export function domain(events: TimelineEvent[]): [Date, Date] {
  if (!events.length) return [new Date('2026-06-01T00:00:00+05:30'), new Date('2026-09-01T00:00:00+05:30')]
  const times = events.map(e => e.at.getTime())
  return [monthStart(new Date(Math.min(...times))), monthAfter(new Date(Math.max(...times)))]
}

export function ticks([from, to]: [Date, Date]) {
  const months: Date[] = [], weeks: Date[] = []
  for (let at = from; at <= to; at = monthAfter(at)) months.push(at)
  for (let at = new Date(from); at < to; at = new Date(at.getTime() + 7 * 864e5)) weeks.push(at)
  return { months, weeks }
}

export function busiestDay(events: TimelineEvent[]) {
  const tally = new Map<string, number>()
  for (const event of events) {
    const day = dayKey(event.at)
    tally.set(day, (tally.get(day) ?? 0) + 1)
  }
  return [...tally].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? ''
}
