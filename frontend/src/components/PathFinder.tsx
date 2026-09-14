import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Route } from 'lucide-react'
import { api, ApiError } from '@/api/client'
import type { GraphNode, PathResponse } from '@/api/types'
import { Button } from './ui/button'
import { Input } from './ui/input'

function EntityPicker({ label, nodes, value, onChange, disabled }: { label: string; nodes: GraphNode[]; value: string; onChange: (id: string) => void; disabled: boolean }) {
  const [search, setSearch] = useState('')
  const matches = nodes.filter(n => n.id === value || `${n.label} ${n.type}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="entity-picker"><label>{label} entity<Input aria-label={`Search ${label.toLowerCase()} entities`} placeholder="Filter by name or identifier" value={search} onChange={e => setSearch(e.target.value)} disabled={disabled} /></label><select aria-label={`${label} entity`} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}><option value="">Choose an entity</option>{matches.map(n => <option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}</select></div>
}
export default function PathFinder({ nodes, onPath, onClear }: { nodes: GraphNode[]; onPath: (path: PathResponse) => void; onClear: () => void }) {
  const [source, setSource] = useState(''), [target, setTarget] = useState('')
  const path = useMutation({ mutationFn: () => api.path(source, target), onSuccess: onPath })
  const clear = () => { path.reset(); onClear() }
  return <section className="path-finder"><div className="section-heading"><div><h2><Route size={17} />Find a connection</h2><p>Trace the shortest path between two entities.</p></div></div>
    <form onSubmit={e => { e.preventDefault(); onClear(); path.mutate() }}><EntityPicker label="Source" nodes={nodes} value={source} onChange={id => { setSource(id); clear() }} disabled={path.isPending} /><EntityPicker label="Target" nodes={nodes} value={target} onChange={id => { setTarget(id); clear() }} disabled={path.isPending} /><div className="path-actions"><Button type="submit" disabled={!source || !target || path.isPending}>{path.isPending ? 'Finding path…' : 'Find path'}</Button><Button type="button" variant="ghost" onClick={clear} disabled={path.isPending}>Clear path</Button></div></form>
    {path.error && <p role="alert" className="path-message">{path.error instanceof ApiError && path.error.status === 404 ? 'These entities are not connected.' : path.error.message}</p>}
    {path.data && <div className="path-result" role="status"><strong>{path.data.edge_ids.length} {path.data.edge_ids.length === 1 ? 'connection' : 'connections'}</strong><span>{path.data.node_ids.map(id => nodes.find(n => n.id === id)?.label ?? id).join(' → ')}</span></div>}
  </section>
}
