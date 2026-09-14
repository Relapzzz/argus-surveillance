import { useState } from 'react'
import { Search } from 'lucide-react'
import type { GraphNode } from '@/api/types'
import { palette, typeNames } from '@/lib/graph'

export default function EntitySearch({ nodes, label, placeholder, onPick }: { nodes: GraphNode[]; label: string; placeholder: string; onPick: (node: GraphNode) => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const needle = query.trim().toLowerCase()
  const matches = needle ? nodes.filter(n => `${n.label} ${n.id}`.toLowerCase().includes(needle)).slice(0, 8) : []
  const pick = (node: GraphNode) => { onPick(node); setQuery(''); setActive(0) }
  return <div className="search"><Search size={14} />
    <input aria-label={label} placeholder={placeholder} value={query} onChange={e => { setQuery(e.target.value); setActive(0) }} onKeyDown={e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, matches.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && matches[active]) { e.preventDefault(); pick(matches[active]) }
      if (e.key === 'Escape') setQuery('')
    }} />
    {needle && <div className="search-menu" role="listbox" aria-label="Matching entities">{matches.length ? matches.map((n, i) => <button type="button" role="option" aria-selected={i === active} data-active={i === active} key={n.id} onMouseDown={e => e.preventDefault()} onClick={() => pick(n)}><i style={{ background: palette[n.type] }} /><span>{n.label}</span><small>{typeNames[n.type]}</small></button>) : <p>Nothing matches “{query.trim()}”.</p>}</div>}
  </div>
}
