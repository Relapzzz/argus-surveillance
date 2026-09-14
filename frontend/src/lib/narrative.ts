import type { Span } from '@/api/types'

export interface NarrativePart { text: string; span?: Span }
export function splitNarrative(text: string, spans: Span[]): NarrativePart[] {
  const characters = Array.from(text)
  const parts: NarrativePart[] = []
  let cursor = 0
  for (const span of [...spans].sort((a, b) => a.start - b.start)) {
    if (span.start < cursor || span.end <= span.start || span.end > characters.length) continue
    if (span.start > cursor) parts.push({ text: characters.slice(cursor, span.start).join('') })
    parts.push({ text: characters.slice(span.start, span.end).join(''), span })
    cursor = span.end
  }
  if (cursor < characters.length) parts.push({ text: characters.slice(cursor).join('') })
  return parts
}
