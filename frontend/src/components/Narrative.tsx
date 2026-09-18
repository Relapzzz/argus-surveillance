import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import type { CaseDetail } from '@/api/types'
import { formatLabel } from '@/lib/format'
import { palette, profileUrl, typeNames } from '@/lib/graph'
import { splitNarrative } from '@/lib/narrative'

export default function Narrative({ detail }: { detail: CaseDetail }) {
  return <div className="narrative">{splitNarrative(detail.narrative, detail.entities).map((part, i) => part.span ? <Link key={i} to={profileUrl(part.span.id)} style={{ '--c': palette[part.span.type] } as CSSProperties} title={`${formatLabel(part.span.type, part.span.label)}, ${typeNames[part.span.type]}`}>{part.text}</Link> : part.text)}</div>
}
