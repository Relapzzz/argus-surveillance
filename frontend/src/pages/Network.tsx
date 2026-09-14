import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { api } from '@/api/client'
import { entityTypes } from '@/api/types'
import type { EntityType, GraphResponse, PathResponse } from '@/api/types'
import { PageHeading } from '@/components/PageHeading'
import { QueryState } from '@/components/QueryState'
import GraphCanvas from '@/components/GraphCanvas'
import GraphFilters from '@/components/GraphFilters'
import EntityPanel from '@/components/EntityPanel'
import PathFinder from '@/components/PathFinder'
import AlertsList from '@/components/AlertsList'
import { Button } from '@/components/ui/button'
import { filterGraph, mergeGraphs } from '@/lib/graph'

export default function Network() {
  const query = useQuery({ queryKey: ['graph'], queryFn: () => api.graph() })
  const [types, setTypes] = useState<EntityType[]>([...entityTypes])
  const [community, setCommunity] = useState<number>()
  const [params, setParams] = useSearchParams()
  const selected = params.get('entity') ?? undefined
  const [panelOpen, setPanelOpen] = useState(true)
  const [focused, setFocused] = useState<GraphResponse>()
  const [path, setPath] = useState<PathResponse>()
  const highlights = params.getAll('highlight')
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: api.alerts })
  const graph = useMemo(() => query.data ? filterGraph(focused ?? query.data, { types, community }) : undefined, [query.data, focused, types, community])
  const select = (id: string) => { setTypes([...entityTypes]); setCommunity(undefined); if (focused && !focused.nodes.some(n => n.id === id)) setFocused(undefined); setParams(previous => { previous.set('entity', id); return previous }); setPanelOpen(true) }
  return <><PageHeading title="Network explorer" description="Follow connections across people, communications, and financial records." />
    <QueryState pending={query.isPending} error={query.error} retry={() => query.refetch()} />
    {query.data && graph && <>{focused && <div className="focus-notice">Showing a neighborhood subgraph <Button variant="ghost" onClick={() => setFocused(undefined)}>Show full network</Button></div>}<GraphFilters nodes={query.data.nodes} types={types} community={community} onTypes={setTypes} onCommunity={setCommunity} onSelect={select} /><GraphCanvas graph={graph} selected={selected} onSelect={select} highlightNodes={path?.node_ids ?? highlights} highlightEdges={path?.edge_ids} /><div className="network-status"><p className="selection-summary" role="status">{selected ? `Selected: ${query.data.nodes.find(n => n.id === selected)?.label ?? selected}` : 'Select an entity on the canvas or search by label.'}</p>{(path || highlights.length > 0) && <div className="highlight-summary"><span>{(path?.node_ids ?? highlights).length} highlighted entities{path ? ` · ${path.edge_ids.length} path edges` : ''}</span><Button size="sm" variant="ghost" onClick={() => { setPath(undefined); setParams(previous => { previous.delete('highlight'); return previous }) }}>Clear highlights</Button></div>}</div>
      <PathFinder nodes={query.data.nodes} onClear={() => setPath(undefined)} onPath={result => { setFocused(undefined); setTypes([...entityTypes]); setCommunity(undefined); setPath(result); setPanelOpen(false) }} />
      <details className="network-alerts panel"><summary>Pattern alerts <span>{alerts.data?.length ?? '—'}</span></summary><QueryState error={alerts.error} pending={alerts.isPending} retry={() => alerts.refetch()} />{alerts.data && <AlertsList alerts={alerts.data} onSelect={alert => { setPath(undefined); setFocused(undefined); setTypes([...entityTypes]); setCommunity(undefined); const next = new URLSearchParams(); alert.entity_ids.forEach(id => next.append('highlight', id)); if (alert.entity_ids[0]) next.set('entity', alert.entity_ids[0]); setParams(next); setPanelOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}</details>
    </>}
    <EntityPanel key={selected} id={selected} open={panelOpen} onClose={() => setPanelOpen(false)} onSelect={select} onEgo={(ego, expand) => { setTypes([...entityTypes]); setCommunity(undefined); setFocused(expand && graph ? mergeGraphs(graph, ego) : ego) }} />
  </>
}
