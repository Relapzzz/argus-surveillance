import { describe, expect, it } from 'vitest'
import { fixture } from '@/api/fixture'
import type { GraphResponse } from '@/api/types'
import { buildEvents, domain, lanes } from './timeline'

const graph = fixture.graph()
const dinesh = 'person:dinesh deshmukh'

describe('the timeline of the go-between', () => {
  const events = buildEvents(graph, dinesh)

  it('gathers the calls and transfers of the person and of the phone and account they own', () => {
    expect(events.filter(e => e.kind === 'transfer')).toHaveLength(4)
    expect(events.every(e => e.at.getTime() >= events[0].at.getTime())).toBe(true)
    expect(new Set(events.map(e => e.kind))).toEqual(new Set(['call', 'transfer']))
  })

  it('opens a lane for each counterpart, named after the owner and coloured by their group', () => {
    const found = lanes(graph, events)
    const aslam = found.find(l => l.id === 'person:aslam khan')
    const vijay = found.find(l => l.id === 'person:vijay desai')
    expect(aslam).toMatchObject({ label: 'Aslam Khan', group: 0, calls: 4, transfers: 2 })
    expect(vijay).toMatchObject({ label: 'Vijay Desai', group: 1, calls: 4, transfers: 2 })
    expect(found.map(l => l.label)).toContain('91692 84511')
    expect(found.map(l => l.events.length)).toEqual([...found.map(l => l.events.length)].sort((a, b) => b - a))
  })

  it('keeps only the pair asked for', () => {
    const pair = lanes(graph, events, 'person:aslam khan')
    expect(pair.map(l => l.id)).toEqual(['person:aslam khan'])
    expect(pair[0].events).toHaveLength(6)
  })

  it('spans whole months from June to September', () => {
    const [from, to] = domain(events)
    expect(from.toISOString()).toBe('2026-05-31T18:30:00.000Z')
    expect(to.toISOString()).toBe('2026-08-31T18:30:00.000Z')
  })
})

describe('edges without stamps', () => {
  it('adds nothing for a call known only from FIR text', () => {
    const events = buildEvents(graph, 'person:kavita gaikwad')
    expect(events.some(e => e.kind === 'call' && e.via === 'person:kavita gaikwad')).toBe(false)
    expect(events.some(e => e.kind === 'call' && e.counterpart === 'phone:9855744431')).toBe(true)
  })
})

describe('a naive incident time', () => {
  const small: GraphResponse = {
    nodes: [
      { id: 'person:a', type: 'person', label: 'A', attributes: {}, sources: [], metrics: { degree: 1, betweenness: 0, pagerank: 0, community: 0 } },
      { id: 'case:FIR-2026-0001', type: 'case', label: 'FIR-2026-0001', attributes: { fir_number: 'FIR-2026-0001', station: 'Shivajinagar', incident_time: '2026-06-14T15:59:00' }, sources: [], metrics: { degree: 1, betweenness: 0, pagerank: 0, community: 0 } },
    ],
    edges: [{ id: 'person:a|case:FIR-2026-0001', source: 'person:a', target: 'case:FIR-2026-0001', type: 'mentioned_in', weight: 1, attributes: {}, sources: [] }],
  }

  it('reads as Indian Standard Time', () => {
    const [event] = buildEvents(small, 'person:a')
    expect(event).toMatchObject({ kind: 'fir', firNumber: 'FIR-2026-0001', station: 'Shivajinagar' })
    expect(event.at.toISOString()).toBe('2026-06-14T10:29:00.000Z')
  })
})
