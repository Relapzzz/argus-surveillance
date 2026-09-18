import { describe, expect, it } from 'vitest'
import { fixture } from './fixture'
import { entityTypes } from './types'

describe('fixture API contract', () => {
  it('counts all types and returns induced subgraphs', () => {
    const graph = fixture.graph(), stats = fixture.stats()
    expect(Object.keys(stats.entities)).toEqual([...entityTypes])
    expect(Object.values(stats.entities).reduce((a, b) => a + b, 0)).toBe(graph.nodes.length)
    const filtered = fixture.graph({ types: ['person'], community: 0, min_degree: 3 })
    expect(filtered.nodes.length).toBeGreaterThan(0)
    expect(filtered.nodes.every(n => n.type === 'person' && n.metrics.community === 0 && n.metrics.degree >= 3)).toBe(true)
    const ids = new Set(filtered.nodes.map(n => n.id))
    expect(filtered.edges.every(e => ids.has(e.source) && ids.has(e.target))).toBe(true)
  })
  it('matches neighbor and ego shapes without leaking mutable graph objects', () => {
    const id = fixture.graph().nodes[0].id, detail = fixture.entity(id)
    expect(new Set(fixture.ego(id).nodes.map(n => n.id))).toEqual(new Set([id, ...detail.neighbors.map(n => n.id)]))
    const graph = fixture.graph(); graph.nodes[0].label = 'changed'
    expect(fixture.entity(id).entity.label).not.toBe('changed')
  })
  it('returns linked paths and proper not-found errors', () => {
    const source = 'phone:9774964990', target = 'person:aslam khan'
    const result = fixture.path(source, target)
    expect(result.node_ids[0]).toBe(source)
    expect(result.node_ids.at(-1)).toBe(target)
    expect(result.edge_ids).toHaveLength(result.node_ids.length - 1)
    result.edge_ids.forEach((id, i) => {
      const edge = fixture.graph().edges.find(e => e.id === id)!
      expect(new Set([edge.source, edge.target])).toEqual(new Set(result.node_ids.slice(i, i + 2)))
    })
    expect(result.node_ids).toHaveLength(4)
    expect(result.node_ids.some(id => id.startsWith('case:'))).toBe(false)
    expect(() => fixture.path('missing', target)).toThrow()
    expect(() => fixture.case('missing')).toThrow()
  })
  it('ranks people like the API and phrases the go-between', () => {
    expect(fixture.keyPlayers(2).map(p => p.label)).toEqual(['Vijay Desai', 'Aslam Khan'])
    const bridge = fixture.keyPlayers(50).find(p => p.entity_id === 'person:dinesh deshmukh')!
    expect(bridge.reason).toBe('bridges communities 0 and 1')
    expect(fixture.keyPlayers(2).map(p => p.reason)).toEqual(['bridges communities 0, 1 and 3', 'most connected in community 0'])
  })
  it('returns case summaries without narratives and with distinct span counts', () => {
    for (const summary of fixture.cases()) {
      expect(summary).not.toHaveProperty('narrative')
      const detail = fixture.case(summary.id)
      expect(summary.entity_count).toBe(new Set(detail.entities.map(e => e.id)).size)
    }
  })
})
