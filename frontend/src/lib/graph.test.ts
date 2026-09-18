import { describe, expect, it } from 'vitest'
import type { GraphResponse } from '@/api/types'
import * as graphHelpers from './graph'
import { groupNames, humanize, profileUrl, routeUrl } from './graph'

const node = (id: string, type: GraphResponse['nodes'][number]['type'], label: string, community: number): GraphResponse['nodes'][number] => ({ id, type, label, attributes: {}, sources: [], metrics: { degree: 1, betweenness: 0, pagerank: 0, community } })
const graph: GraphResponse = {
  nodes: [node('person:a', 'person', 'A', 0), node('person:b', 'person', 'B', 0), node('person:c', 'person', 'C', 1), node('location:warje', 'location', 'Warje', 0), node('location:kondhwa', 'location', 'Kondhwa', 1), node('location:pune', 'location', 'Pune', 1), node('account:1', 'account', '1', 2)],
  edges: [
    { id: 'person:a|location:warje', source: 'person:a', target: 'location:warje', type: 'resides_at', weight: 1, attributes: {}, sources: [] },
    { id: 'location:warje|person:b', source: 'location:warje', target: 'person:b', type: 'resides_at', weight: 1, attributes: {}, sources: [] },
    { id: 'location:pune|person:c', source: 'person:c', target: 'location:pune', type: 'resides_at', weight: 1, attributes: {}, sources: [] },
    { id: 'location:kondhwa|person:c', source: 'person:c', target: 'location:kondhwa', type: 'resides_at', weight: 1, attributes: {}, sources: [] },
  ],
}

describe('group names', () => {
  it('names a group after where its people live, ignoring the city, and falls back to a number', () => {
    const names = groupNames(graph)
    expect(names.get(0)).toBe('Warje group')
    expect(names.get(1)).toBe('Kondhwa group')
    expect(names.get(2)).toBe('Group 2')
  })
  it('rewrites API reasons with group names', () => {
    const names = groupNames(graph)
    expect(humanize('bridges communities 0 and 1', names)).toBe('bridges the Warje group and the Kondhwa group')
    expect(humanize('most connected in community 2', names)).toBe('most connected in group 2')
    expect(humanize('high influence in community 1')).toBe('high influence in group 1')
    expect(humanize('totalling Rs 4,07,743 below the Rs 50,000 threshold')).toBe('totalling ₹4,07,743 below the ₹50,000 threshold')
  })
  it('builds routes', () => {
    expect(profileUrl('person:dinesh deshmukh')).toBe('/entity/person%3Adinesh%20deshmukh')
    expect(routeUrl('phone:9774964990', 'person:aslam khan')).toBe('/network?tab=route&from=phone%3A9774964990&to=person%3Aaslam+khan')
  })
})

describe('graph helpers', () => {
  it('filters to induced subgraphs and merges by id', () => {
    const { filterGraph, mergeGraphs } = graphHelpers
    const persons = filterGraph(graph, { types: ['person'] })
    expect(persons.nodes.map(n => n.id)).toEqual(['person:a', 'person:b', 'person:c'])
    expect(persons.edges).toEqual([])
    const merged = mergeGraphs(persons, filterGraph(graph, { community: 0 }))
    expect(merged.nodes.map(n => n.id)).toEqual(['person:a', 'person:b', 'person:c', 'location:warje'])
    expect(merged.edges).toHaveLength(2)
  })
  it('builds the network, case, timeline and map urls and title-cases ids', () => {
    const { networkUrl, caseUrl, timelineUrl, mapUrl, labelFromId } = graphHelpers
    expect(networkUrl()).toBe('/network')
    expect(networkUrl(['person:a', 'phone:1'])).toBe('/network?highlight=person%3Aa&highlight=phone%3A1&entity=person%3Aa')
    expect(caseUrl('case:FIR-2026-0001')).toBe('/cases?case=case%3AFIR-2026-0001')
    expect(timelineUrl('person:a', 'person:b')).toBe('/timeline?entity=person%3Aa&with=person%3Ab')
    expect(mapUrl()).toBe('/map')
    expect(mapUrl('person:a')).toBe('/map?entity=person%3Aa')
    expect(labelFromId('person:aslam khan')).toBe('Aslam Khan')
    expect(labelFromId('account:13389083863')).toBe('13389083863')
  })
})
