import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import type { CaseDetail } from '@/api/types'
import { networkUrl, paperPalette, typeNames } from '@/lib/graph'
import { splitNarrative } from '@/lib/narrative'

export default function Narrative({ detail }: { detail: CaseDetail }) {
  return <div className="sheet">{splitNarrative(detail.narrative, detail.entities).map((part, i) => part.span ? <Link key={i} to={networkUrl([part.span.id])} style={{ '--c': paperPalette[part.span.type] } as CSSProperties} title={`${part.span.label} · ${typeNames[part.span.type]}`}>{part.text}</Link> : part.text)}</div>
}
