import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api, ApiError } from '@/api/client'
import type { GraphNode, PathResponse } from '@/api/types'
import { palette, typeNames } from '@/lib/graph'
import EntitySearch from './EntitySearch'
import { Button } from './ui/button'

function Pick({ label, nodes, value, selected, onChange }: { label: string; nodes: GraphNode[]; value: string; selected?: string; onChange: (id: string) => void }) {
  const node = nodes.find(n => n.id === value)
  return <div className="pick"><span className="pick-label">{label}</span>
    {node ? <div className="picked"><i style={{ background: palette[node.type] }} /><span>{node.label}</span><small>{typeNames[node.type]}</small><button type="button" aria-label={`Clear ${label}`} onClick={() => onChange('')}><X size={13} /></button></div>
      : <><EntitySearch nodes={nodes} label={`Search ${label} entity`} placeholder="Name, phone, account or plate" onPick={n => onChange(n.id)} />{selected && <button type="button" className="text-button" onClick={() => onChange(selected)}>Use the selected entity</button>}</>}
  </div>
}
export default function PathFinder({ nodes, selected, onPath, onClear }: { nodes: GraphNode[]; selected?: string; onPath: (path: PathResponse) => void; onClear: () => void }) {
  const [from, setFrom] = useState(''), [to, setTo] = useState('')
  const path = useMutation({ mutationFn: () => api.path(from, to), onSuccess: onPath })
  const change = (set: (id: string) => void) => (id: string) => { set(id); path.reset(); onClear() }
  return <form className="route" onSubmit={e => { e.preventDefault(); onClear(); path.mutate() }}>
    <p className="inspector-lede">Find the shortest chain of calls, transfers and shared cases between any two entities.</p>
    <Pick label="From" nodes={nodes} value={from} selected={selected} onChange={change(setFrom)} />
    <Pick label="To" nodes={nodes} value={to} selected={selected} onChange={change(setTo)} />
    <div className="actions"><Button type="submit" size="sm" disabled={!from || !to || path.isPending}>{path.isPending ? 'Tracing…' : 'Trace route'}</Button>{(path.data || path.error) && <Button type="button" size="sm" variant="ghost" onClick={() => { path.reset(); onClear() }}>Clear</Button>}</div>
    {path.error && <p role="alert" className="route-message">{path.error instanceof ApiError && path.error.status === 404 ? 'No route connects these two entities.' : path.error.message}</p>}
    {path.data && <div className="route-result" role="status"><p><b>{path.data.edge_ids.length}</b> {path.data.edge_ids.length === 1 ? 'hop' : 'hops'} along the shortest route</p><ol className="route-steps">{path.data.node_ids.map(id => { const n = nodes.find(x => x.id === id); return <li key={id}><span>{n?.label ?? id}</span><small>{n ? typeNames[n.type] : ''}</small></li> })}</ol></div>}
  </form>
}
