import { Link } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { GraphResponse } from '@/api/types'
import { palette } from '@/lib/graph'
import { QueryState } from './QueryState'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet'
import { Button } from './ui/button'

export default function EntityPanel({ id, open, onClose, onSelect, onEgo }: { id?: string; open: boolean; onClose: () => void; onSelect: (id: string) => void; onEgo: (graph: GraphResponse, expand: boolean) => void }) {
  const query = useQuery({ queryKey: ['entity', id], queryFn: () => api.entity(id!), enabled: Boolean(id) })
  const ego = useMutation({ mutationFn: async (expand: boolean) => ({ graph: await api.ego(id!), expand }), onSuccess: ({ graph, expand }) => { onEgo(graph, expand); onClose() } })
  const detail = query.data
  return <Sheet open={open && Boolean(id)} onOpenChange={value => { if (!value) onClose() }}><SheetContent className="entity-sheet">
    <SheetHeader><SheetTitle>{detail?.entity.label ?? 'Entity details'}</SheetTitle><SheetDescription>Attributes, network metrics, and source evidence.</SheetDescription></SheetHeader>
    <div className="entity-body"><QueryState pending={query.isPending} error={query.error} retry={() => query.refetch()} />{detail && <>
      <span className="entity-type" style={{ color: palette[detail.entity.type] }}>{detail.entity.type}</span><p className="entity-id">{detail.entity.id}</p>
      <h3>Network metrics</h3><dl className="metrics-grid">{Object.entries(detail.metrics).map(([key, value]) => <div key={key}><dt>{key === 'pagerank' ? 'PageRank' : key}</dt><dd>{Number.isInteger(value) ? value : value.toFixed(4)}</dd></div>)}</dl>
      <h3>Attributes</h3><dl className="evidence">{Object.entries(detail.entity.attributes).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{Array.isArray(value) ? value.join(', ') || 'None' : value === null ? 'Not recorded' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>{!Object.keys(detail.entity.attributes).length && <p className="muted">No attributes recorded.</p>}
      <div className="entity-actions"><Button onClick={() => ego.mutate(false)} disabled={ego.isPending}>Focus neighborhood</Button><Button variant="outline" onClick={() => ego.mutate(true)} disabled={ego.isPending}>Expand neighbors</Button></div><QueryState error={ego.error} />
      <h3>Connected entities <span className="muted">({detail.neighbors.length})</span></h3><div className="neighbor-list">{detail.neighbors.map(n => <button key={n.edge_id} onClick={() => onSelect(n.id)}><i style={{ background: palette[n.type] }} /><span>{n.label}<small>{n.relationship.replaceAll('_', ' ')}</small></span><span className="muted">↗</span></button>)}</div>{!detail.neighbors.length && <p className="muted">No connected entities.</p>}
      <h3>Source cases</h3>{detail.sources.length ? <div className="source-links">{detail.sources.map(source => <Link key={source} to={'/cases?' + new URLSearchParams({ case: source })}>{source}</Link>)}</div> : <p className="muted">No source case is linked to this entity.</p>}
    </>}</div>
  </SheetContent></Sheet>
}
