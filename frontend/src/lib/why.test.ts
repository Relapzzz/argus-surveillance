import { describe, expect, it } from 'vitest'
import { fixture } from '@/api/fixture'
import { groupNames } from './graph'
import { firsOf, identifiersOf } from './profile'
import { whyInOneLine, whyItMatters } from './why'

const graph = fixture.graph()
const cases = fixture.cases()
const alerts = fixture.alerts()
const players = fixture.keyPlayers(50)
const names = groupNames(graph)
const input = (id: string) => {
  const entity = graph.nodes.find(n => n.id === id)!
  return { entity, identifiers: identifiersOf(graph, id), player: players.find(p => p.entity_id === id), alerts, firs: firsOf(graph, cases, id), names }
}

describe('why it matters', () => {
  it('opens with the go-between finding and adds the FIR record', () => {
    const sentences = whyItMatters(input('person:dinesh deshmukh'))
    expect(sentences[0]).toBe('Dinesh Deshmukh is the only route between the Swargate group and the Camp group: 5 connections, yet every path between the groups runs through them.')
    expect(sentences).toContain('Not named in any FIR. Known only from call, bank and history records.')
    expect(whyInOneLine(input('person:dinesh deshmukh'))).toBe(sentences[0])
  })
  it('rewrites the key player reason with group names', () => {
    const sentences = whyItMatters(input('person:aslam khan'))
    expect(sentences.some(s => s.endsWith('in the Swargate group.'))).toBe(true)
    expect(sentences.some(s => s.startsWith('Named in ') && s.includes('as accused'))).toBe(true)
  })
  it('adds a sentence for every other pattern that names the entity', () => {
    const sentences = whyItMatters(input('person:ramesh more'))
    expect(sentences.some(s => s.startsWith('Calls almost only at night: 15 of 15 calls'))).toBe(true)
  })
})
