import { describe, expect, it } from 'vitest'
import { fixture } from '@/api/fixture'
import { aggregatePlaces } from './places'

const graph = fixture.graph()
const cases = fixture.cases()
const labels = (ids: { label: string }[]) => ids.map(place => place.label).sort()

describe('places across the whole workspace', () => {
  it('keeps one record per mapped place', () => {
    const { places } = aggregatePlaces(graph, cases)
    expect(places).toHaveLength(16)
    expect(places.every(place => Number.isFinite(place.lat) && Number.isFinite(place.lon))).toBe(true)
  })

  it('links a place to the FIRs that name it and to the people in them', () => {
    const { places } = aggregatePlaces(graph, cases)
    const shivajinagar = places.find(place => place.label === 'Shivajinagar')!
    expect(shivajinagar.firs.map(item => item.fir_number)).toContain('FIR-2026-0001')
    expect(shivajinagar.calls).toBeGreaterThan(0)
    expect(shivajinagar.people.length).toBeGreaterThan(0)
  })

  it('reads a home from the address as well as from a resides at link', () => {
    const { places } = aggregatePlaces(graph, cases)
    const kausarBaug = places.find(place => place.label === 'Kausar Baug')!
    expect(kausarBaug.residents.map(person => person.id)).toContain('person:dinesh deshmukh')
  })
})

describe('places for one person', () => {
  const { places } = aggregatePlaces(graph, cases, 'person:dinesh deshmukh')

  it('keeps both localities of the address and the tower areas of the calls', () => {
    expect(labels(places)).toEqual(['Baner', 'Hinjewadi', 'Kausar Baug', 'Kondhwa', 'Kothrud', 'Shivajinagar', 'Swargate', 'Yerwada'])
  })

  it('counts the calls made near each tower area', () => {
    expect(Object.fromEntries(places.map(place => [place.label, place.calls]))).toEqual({
      Kothrud: 4, Shivajinagar: 2, Hinjewadi: 2, Baner: 2, Yerwada: 2, Swargate: 1, Kondhwa: 1, 'Kausar Baug': 0,
    })
  })

  it('keeps only his own home and his own FIRs', () => {
    expect(places.filter(place => place.residents.length).map(place => place.label).sort()).toEqual(['Kausar Baug', 'Kondhwa'])
    expect(places.every(place => place.firs.length === 0)).toBe(true)
  })
})
