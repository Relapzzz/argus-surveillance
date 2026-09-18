import { describe, expect, it } from 'vitest'
import { fixture } from '@/api/fixture'
import { guideTasks } from './guide'

const data = { alerts: fixture.alerts(), players: fixture.keyPlayers(), cases: fixture.cases(), firstCase: fixture.case('case:FIR-2026-0001'), graph: fixture.graph() }

describe('guide tasks', () => {
  it('points every task at the records that support it', () => {
    const tasks = guideTasks(data)
    expect(tasks.map(t => t.to === null)).toEqual([false, false, false, false, false, false, false])
    expect(tasks[0].to).toContain('entity=person%3Adinesh+deshmukh')
    expect(tasks[1].to).toContain('from=phone%3A9774964990')
    expect(tasks[2].to).toBe('/alerts?type=structuring')
    expect(tasks[3].to).toBe('/timeline?entity=person%3Adinesh+deshmukh')
    expect(tasks[5].to).toBe('/cases?case=case%3AFIR-2026-0001')
  })
  it('drops the tasks the records cannot support and keeps the ones that need nothing', () => {
    const tasks = guideTasks({})
    expect(tasks.filter(t => t.to).map(t => t.title)).toEqual(['See where it happened', 'Add a new FIR'])
  })
})
