import { Link } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { GraphResponse } from '@/api/types'
import { groupColor, palette, typeNames } from '@/lib/graph'
import { QueryState } from './QueryState'
import { Button } from './ui/button'

const formatValue = (value: unknown) => Array.isArray(value) ? value.join(', ') || 'None' : value === null ? 'Not recorded' : typeof value === 'object' ? JSON.stringify(value) : String(value)

export default function EntityDetails({ id, onSelect, onEgo }: { id?: string; onSelect: (id: string) => void; onEgo: (graph: GraphResponse, expand: boolean) => void }) {
  const query = useQuery({ queryKey: ['entity', id], queryFn: () => api.entity(id!), enabled: Boolean(id) })
  const ego = useMutation({ mutationFn: async (expand: boolean) => ({ graph: await api.ego(id!), expand }), onSuccess: ({ graph, expand }) => onEgo(graph, expand) })
  if (!id) return <div className="inspector-empty"><h2>Nothing selected</h2><p>Click an entity on the canvas, or search for a name, phone number, account or plate. This panel shows what it is, how central it is, who it touches and which FIRs mention it.</p></div>
  const detail = query.data
  return <div className="entity">
    <QueryState pending={query.isPending} error={query.error} retry={() => query.refetch()} />
    {detail && <>
      <p className="entity-kind"><i style={{ background: palette[detail.entity.type] }} />{typeNames[detail.entity.type]}<span className="group-chip"><i style={{ background: groupColor(detail.metrics.community) }} />group {detail.metrics.community}</span></p>
      <h2 className="entity-name display">{detail.entity.label}</h2>
      <p className="entity-id">{detail.entity.id}</p>
      <dl className="metric-grid">
        <div className="metric"><dt>Connections<small>degree</small></dt><dd>{detail.metrics.degree}</dd></div>
        <div className="metric"><dt>Bridging<small>betweenness</small></dt><dd>{detail.metrics.betweenness.toFixed(3)}</dd></div>
        <div className="metric"><dt>Influence<small>PageRank</small></dt><dd>{detail.metrics.pagerank.toFixed(4)}</dd></div>
        <div className="metric"><dt>Group<small>Louvain community</small></dt><dd>{detail.metrics.community}</dd></div>
      </dl>
      <div className="actions"><Button size="sm" onClick={() => ego.mutate(false)} disabled={ego.isPending}>Focus neighborhood</Button><Button size="sm" variant="outline" onClick={() => ego.mutate(true)} disabled={ego.isPending}>Expand neighbors</Button></div>
      <QueryState error={ego.error} />
      {Object.keys(detail.entity.attributes).length > 0 && <><h3>Record</h3><dl className="kv">{Object.entries(detail.entity.attributes).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{formatValue(value)}</dd></div>)}</dl></>}
      <h3>Connections <span>({detail.neighbors.length})</span></h3>
      <div className="neighbors">{detail.neighbors.map(n => <button key={n.edge_id} onClick={() => onSelect(n.id)}><i style={{ background: palette[n.type] }} /><span>{n.label}</span><small>{n.relationship.replaceAll('_', ' ')}</small></button>)}</div>
      {!detail.neighbors.length && <p className="muted">No connections.</p>}
      <h3>Source FIRs</h3>
      {detail.sources.length ? <div className="sources">{detail.sources.map(source => <Link key={source} to={'/cases?' + new URLSearchParams({ case: source })}>{source.replace(/^case:/, '')}</Link>)}</div> : <p className="muted">Not named in any FIR. Known only from call, transaction or criminal history records.</p>}
    </>}
  </div>
}
