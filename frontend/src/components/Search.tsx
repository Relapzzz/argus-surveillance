import { useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import type { CaseSummary, EntityType, GraphNode } from '@/api/types'
import { formatLabel } from '@/lib/format'
import { palette, typeNames } from '@/lib/graph'

export interface SearchItem { id: string; label: string; type: EntityType; hint?: string }
export const nodeItems = (nodes: GraphNode[]): SearchItem[] => nodes.map(n => ({ id: n.id, label: formatLabel(n.type, n.label), type: n.type }))
export const caseItems = (cases: CaseSummary[]): SearchItem[] => cases.map(c => ({ id: c.id, label: c.fir_number, type: 'case', hint: c.station }))
const squash = (text: string) => text.replace(/\s+/g, '').toLowerCase()

export default function Search({ items, label, placeholder, onPick, onFocus }: { items: SearchItem[]; label: string; placeholder: string; onPick: (item: SearchItem) => void; onFocus?: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const needle = query.trim().toLowerCase(), squashed = squash(query)
  const matches = squashed ? items.filter(i => `${i.label} ${i.hint ?? ''}`.toLowerCase().includes(needle) || squash(i.label).includes(squashed) || i.id.includes(squashed)).slice(0, 8) : []
  const pick = (item: SearchItem) => { onPick(item); setQuery(''); setActive(0) }
  return <div className="search"><SearchIcon size={16} aria-hidden="true" />
    <input aria-label={label} placeholder={placeholder} value={query} onFocus={onFocus} onChange={e => { setQuery(e.target.value); setActive(0) }} onKeyDown={e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, matches.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && matches[active]) { e.preventDefault(); pick(matches[active]) }
      if (e.key === 'Escape') setQuery('')
    }} />
    {squashed && <div className="search-menu" role="listbox" aria-label="Matching records">{matches.length ? matches.map((i, at) => <button type="button" role="option" aria-selected={at === active} data-active={at === active} key={i.id} onMouseDown={e => e.preventDefault()} onClick={() => pick(i)}><i style={{ background: palette[i.type] }} /><span className="tabular">{i.label}</span><small>{i.hint ?? typeNames[i.type]}</small></button>) : <p>Nothing matches {query.trim()}.</p>}</div>}
  </div>
}
