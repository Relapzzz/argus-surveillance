import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatInr, formatLabel, formatPhone, formatPlate, formatTime, plural } from './format'

describe('Indian formats', () => {
  it('groups phones, plates and rupees the Indian way', () => {
    expect(formatPhone('9876543210')).toBe('98765 43210')
    expect(formatPhone('12345')).toBe('12345')
    expect(formatPlate('MH14JX0154')).toBe('MH 14 JX 0154')
    expect(formatLabel('vehicle', 'MH12AB1234')).toBe('MH 12 AB 1234')
    expect(formatLabel('person', 'Aslam Khan')).toBe('Aslam Khan')
    expect(formatInr(440000)).toBe('₹4,40,000')
    expect(formatInr(1500)).toBe('₹1,500')
    expect(plural(1, 'FIR')).toBe('1 FIR')
    expect(plural(1820, 'relationship')).toBe('1,820 relationships')
  })
  it('reads stamps with an offset and naive stamps as Indian time', () => {
    expect(formatDate('2026-07-06T19:02:00+05:30')).toBe('6 July 2026')
    expect(formatTime('2026-07-06T19:02:00+05:30')).toBe('7:02 pm')
    expect(formatDateTime('2026-06-14T15:59:00')).toBe('14 June 2026, 3:59 pm')
    expect(formatTime('2026-06-14T00:30:00+05:30')).toBe('12:30 am')
  })
})
