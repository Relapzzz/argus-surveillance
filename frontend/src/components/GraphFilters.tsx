import { useState } from 'react'
import { entityTypes } from '@/api/types'
import type { EntityType, GraphNode } from '@/api/types'
import { palette } from '@/lib/graph'
import { Input } from './ui/input'
import { Button } from './ui/button'

export default function GraphFilters({ nodes, types, community, onTypes, onCommunity, onSelect }: { nodes: GraphNode[]; types: EntityType[]; community?: number; onTypes: (types: EntityType[]) => void; onCommunity: (value?: number) => void; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const matches = search.trim() ? nodes.filter(n => `${n.label} ${n.id}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 10) : []
  return <div className="graph-filters">
    <div className="filter-top"><div className="search-box"><label htmlFor="entity-search" className="sr-only">Search entities</label><Input id="entity-search" placeholder="Search a name, phone, or identifier…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && matches[0]) { onSelect(matches[0].id); setSearch('') } }} />
      {search.trim() && <div className="search-results" aria-label="Search results">{matches.length ? matches.map(n => <button key={n.id} onClick={() => { onSelect(n.id); setSearch('') }}><i style={{ background: palette[n.type] }} /><span>{n.label}</span><small>{n.type}</small></button>) : <p>No matching entities.</p>}</div>}</div>
      <label className="community-filter">Community<select aria-label="Community" value={community ?? ''} onChange={e => onCommunity(e.target.value === '' ? undefined : Number(e.target.value))}><option value="">All communities</option>{[...new Set(nodes.map(n => n.metrics.community))].sort((a, b) => a - b).map(id => <option key={id} value={id}>Community {id}</option>)}</select></label>
    </div>
    <div className="type-filters">{entityTypes.map(type => <label key={type}><input type="checkbox" checked={types.includes(type)} onChange={e => onTypes(e.target.checked ? [...types, type] : types.filter(t => t !== type))} /><i style={{ background: palette[type] }} />{type}</label>)}<Button variant="ghost" size="sm" onClick={() => { onTypes([...entityTypes]); onCommunity(undefined) }}>Clear filters</Button></div>
  </div>
}
