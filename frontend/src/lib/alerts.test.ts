import { describe, expect, it } from 'vitest'
import { fixture } from '@/api/fixture'
import { groupNames } from './graph'
import { alertQuestion, alertSubject, evidenceSummary } from './alerts'

const alerts = fixture.alerts()
const names = groupNames(fixture.graph())
const of = (type: string) => alerts.find(a => a.type === type)!

describe('alert wording', () => {
  it('asks the question behind each pattern', () => {
    expect(alertQuestion('bridge_node')).toBe('Who connects the groups?')
    expect(alertQuestion('night_calls')).toBe('Which phones only work at night?')
  })
  it('summarises a call burst', () => {
    expect(evidenceSummary(of('burst_calls'))).toBe('10 calls in 49 minutes on 6 July 2026, 7:02 pm to 7:52 pm')
  })
  it('summarises structuring with the account the money moved on to', () => {
    expect(evidenceSummary(of('structuring'))).toBe('9 transfers of ₹40,655 to ₹48,328 within 7 days from 7 June 2026, ₹4,07,743 in all, then ₹4,07,743 moved on to account 13389083863')
  })
  it('summarises a go-between with group names', () => {
    expect(evidenceSummary(of('bridge_node'), names)).toBe('5 connections against a typical 17, yet every route between the Swargate group and the Camp group runs through them')
  })
  it('summarises night calls', () => {
    expect(evidenceSummary(of('night_calls'))).toBe('15 of 15 calls between midnight and 4 am, 14 June to 12 August 2026')
  })
  it('names the subject of an alert', () => {
    expect(alertSubject(of('burst_calls'))).toEqual({ entity: 'phone:6904966319', with: 'phone:7745299124' })
    expect(alertSubject(of('bridge_node'))).toEqual({ entity: 'person:dinesh deshmukh', with: undefined })
  })
})
