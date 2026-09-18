import { describe, expect, it } from 'vitest'
import { fixture } from '@/api/fixture'
import { activityOf, associatesOf, firsOf, identifiersOf, ownerOf, placesOf } from './profile'

const graph = fixture.graph()
const cases = fixture.cases()

describe('profile', () => {
  it('reads owners and owned identifiers', () => {
    expect(identifiersOf(graph, 'person:dinesh deshmukh').sort()).toEqual(['account:3487401640052', 'person:dinesh deshmukh', 'phone:6318699938'])
    expect(ownerOf(graph, 'phone:6318699938')?.label).toBe('Dinesh Deshmukh')
    expect(ownerOf(graph, 'person:dinesh deshmukh')).toBeUndefined()
    expect(identifiersOf(graph, 'phone:6318699938')).toEqual(['phone:6318699938'])
  })
  it('lists the FIRs an entity is named in, with the role from that FIR', () => {
    expect(firsOf(graph, cases, 'person:dinesh deshmukh')).toEqual([])
    const firs = firsOf(graph, cases, 'person:aslam khan')
    expect(firs.length).toBeGreaterThan(0)
    expect(firs.every(f => f.role === 'accused')).toBe(true)
  })
  it('finds places from edges and from the address line', () => {
    const places = placesOf(graph, 'person:dinesh deshmukh')
    expect(places.map(p => p.node.label)).toEqual(['Kausar Baug', 'Kondhwa'])
    expect(places.every(p => p.link === 'home')).toBe(true)
  })
  it('groups associates by how they are linked', () => {
    const associates = associatesOf(graph, 'person:dinesh deshmukh')
    expect(associates.called.map(a => a.node.label)).toContain('Aslam Khan')
    expect(associates.called.map(a => a.node.label)).toContain('Vijay Desai')
    expect(new Set(associates.called.map(a => a.community))).toEqual(new Set([0, 1]))
    expect(associates.called.every(a => a.count > 0)).toBe(true)
  })
  it('sums calls and money across the identifiers of a person', () => {
    const activity = activityOf(graph, 'person:dinesh deshmukh')
    expect(activity.calls).toBeGreaterThan(0)
    expect(activity.moneyIn + activity.moneyOut).toBeGreaterThan(0)
    expect(activity.firstSeen! < activity.lastSeen!).toBe(true)
  })
})
