import { expect, it } from 'vitest'
import { splitNarrative } from './narrative'

it('uses Python code point offsets and preserves every source character', () => {
  const text = '\u{1f600} Ramesh <script>bad()</script> पुुणे'
  const parts = splitNarrative(text, [{ id: 'person:ramesh', label: 'Ramesh', type: 'person', start: 2, end: 8 }])
  expect(parts.find(p => p.span)?.text).toBe('Ramesh')
  expect(parts.map(p => p.text).join('')).toBe(text)
})
it('ignores invalid and overlapping spans without losing text', () => {
  const base = { id: 'person:abc', label: 'abc', type: 'person' as const }
  const parts = splitNarrative('abc def', [{ ...base, start: 0, end: 3 }, { ...base, start: 1, end: 7 }, { ...base, start: 7, end: 90 }])
  expect(parts.map(p => p.text).join('')).toBe('abc def')
  expect(parts.filter(p => p.span)).toHaveLength(1)
})
