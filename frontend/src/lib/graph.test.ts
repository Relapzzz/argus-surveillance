import { describe, expect, it } from 'vitest'
import type { GraphResponse } from '@/api/types'
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
  })
  it('builds routes', () => {
    expect(profileUrl('person:dinesh deshmukh')).toBe('/entity/person%3Adinesh%20deshmukh')
    expect(routeUrl('phone:9774964990', 'person:aslam khan')).toBe('/network?tab=route&from=phone%3A9774964990&to=person%3Aaslam+khan')
  })
})
