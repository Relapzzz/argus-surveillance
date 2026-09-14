import { Link } from 'react-router'
import type { CaseDetail } from '@/api/types'
import { networkUrl, palette } from '@/lib/graph'
import { splitNarrative } from '@/lib/narrative'

export default function Narrative({ detail }: { detail: CaseDetail }) {
  return <div className="narrative">{splitNarrative(detail.narrative, detail.entities).map((part, i) => part.span ? <Link className="narrative-span" key={i} to={networkUrl([part.span.id])} style={{ color: palette[part.span.type], backgroundColor: palette[part.span.type] + '16', borderBottomColor: palette[part.span.type] + '77' }} title={`${part.span.label} · ${part.span.type}`}>{part.text}</Link> : part.text)}</div>
}
