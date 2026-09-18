import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { api } from '@/api/client'
import { entityTypes } from '@/api/types'
import type { EntityType, GraphResponse, PathResponse } from '@/api/types'
import { QueryState } from '@/components/QueryState'
import GraphCanvas from '@/components/GraphCanvas'
import Search, { nodeItems } from '@/components/Search'
import EntityDetails from '@/components/Inspector'
import PathFinder from '@/components/PathFinder'
import AlertsList from '@/components/AlertsList'
import { Bi } from '@/components/Bi'
import { Button, buttonVariants } from '@/components/ui/button'
import { formatCount, formatLabel, plural } from '@/lib/format'
import { filterGraph, groupName, groupNames, mergeGraphs, palette, typeNames } from '@/lib/graph'
import { hi } from '@/lib/vocab'
import './network.css'

type Tab = 'entity' | 'route' | 'alerts'
const tabs: { id: Tab; label: string }[] = [{ id: 'entity', label: 'Entity' }, { id: 'route', label: 'Route' }, { id: 'alerts', label: 'Alerts' }]
const asTab = (value: string | null): Tab => value === 'route' || value === 'alerts' ? value : 'entity'

export default function Network() {
  const query = useQuery({ queryKey: ['graph'], queryFn: () => api.graph() })
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: api.alerts })
  const [types, setTypes] = useState<EntityType[]>([...entityTypes])
  const [community, setCommunity] = useState<number>()
  const [colorBy, setColorBy] = useState<'type' | 'group'>('type')
  const [showGroups, setShowGroups] = useState(true)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(asTab(params.get('tab')))
  const selected = params.get('entity') ?? undefined
  const highlights = params.getAll('highlight')
  const from = params.get('from') ?? '', to = params.get('to') ?? ''
  const [focused, setFocused] = useState<GraphResponse>()
  const [path, setPath] = useState<PathResponse>()
  useEffect(() => { if (params.has('tab')) setTab(asTab(params.get('tab'))) }, [params])
  const graph = useMemo(() => query.data ? filterGraph(focused ?? query.data, { types, community }) : undefined, [query.data, focused, types, community])
  const nodes = query.data?.nodes ?? []
  const names = useMemo(() => query.data ? groupNames(query.data) : undefined, [query.data])
  const items = useMemo(() => nodeItems(nodes), [nodes])
  const counts = useMemo(() => Object.fromEntries(entityTypes.map(t => [t, nodes.filter(n => n.type === t).length])) as Record<EntityType, number>, [nodes])
  const groups = useMemo(() => [...new Set(nodes.map(n => n.metrics.community))].sort((a, b) => a - b), [nodes])
  const showAll = () => { setTypes(t => t.length === entityTypes.length ? t : [...entityTypes]); setCommunity(undefined) }
  const select = (id: string) => {
    if (!graph?.nodes.some(n => n.id === id)) showAll()
    if (focused && !focused.nodes.some(n => n.id === id)) setFocused(undefined)
    setParams(previous => { previous.set('entity', id); previous.delete('tab'); return previous })
    setTab('entity')
  }
  const deselect = () => setParams(previous => { previous.delete('entity'); return previous })
  const clearHighlights = () => { setPath(undefined); setParams(previous => { previous.delete('highlight'); return previous }) }
  const selectedNode = selected ? nodes.find(n => n.id === selected) : undefined
  const highlighted = path?.node_ids ?? highlights
  return <div className="stage">
    <title>Network, Argus</title>
    <section className="stage-main">
      <header className="stage-head"><h1 className="display">Network</h1><span className="hi" lang="hi">नेटवर्क</span>
        <Search items={items} label="Search entities" placeholder="Search a name, phone, account or plate" onPick={i => select(i.id)} />
        <select className="control" aria-label="Group" value={community ?? ''} onChange={e => setCommunity(e.target.value === '' ? undefined : Number(e.target.value))}><option value="">All groups</option>{groups.map(id => <option key={id} value={id}>{groupName(names, id)}</option>)}</select>
        <span className="seg-label">Colour by</span><div className="seg" role="group" aria-label="Colour nodes by"><button type="button" aria-pressed={colorBy === 'type'} onClick={() => setColorBy('type')}>Type</button><button type="button" aria-pressed={colorBy === 'group'} onClick={() => setColorBy('group')}>Group</button></div>
        <label className="check"><input type="checkbox" checked={showGroups} onChange={e => setShowGroups(e.target.checked)} />Group areas</label>
        {focused && <Button size="sm" variant="outline" onClick={() => setFocused(undefined)}>Show full network</Button>}
      </header>
      <QueryState pending={query.isPending} error={query.error} retry={() => query.refetch()} />
      {graph && !nodes.length && <div className="stage-empty"><h2>No records yet</h2><p>Add an FIR, call records or transactions and the network draws itself.</p><Link className={buttonVariants({ size: 'lg' })} to="/ingest"><Bi en="Add records" hi={hi.addRecords} /></Link></div>}
      {graph && nodes.length > 0 && <GraphCanvas graph={graph} names={names} selected={selected} onSelect={select} onDeselect={deselect} highlightNodes={highlighted} highlightEdges={path?.edge_ids} colorBy={colorBy} showGroups={showGroups}>
        <div className="legend" role="group" aria-label="Entity types">{entityTypes.map(t => <button type="button" key={t} aria-pressed={types.includes(t)} onClick={() => setTypes(types.includes(t) ? types.filter(x => x !== t) : [...types, t])}><i style={{ background: palette[t] }} /><span>{typeNames[t]}</span><b>{counts[t]}</b></button>)}{types.length < entityTypes.length && <button type="button" onClick={showAll}>Show all types</button>}</div>
      </GraphCanvas>}
      {graph && <footer className="stage-foot"><span className="tabular">{plural(graph.nodes.length, 'entity', 'entities')} and {plural(graph.edges.length, 'relationship')}</span>
        <span className="status" role="status">{path ? `${formatCount(path.node_ids.length)} entities highlighted along ${plural(path.edge_ids.length, 'hop')}` : highlights.length ? `${formatCount(highlights.length)} entities highlighted` : selectedNode ? <>Selected: <b>{formatLabel(selectedNode.type, selectedNode.label)}</b></> : 'Click an entity to inspect it. Scroll to zoom, drag to pan.'}</span>
        {(path || highlights.length > 0) && <Button size="sm" variant="ghost" onClick={clearHighlights}>Clear highlight</Button>}</footer>}
    </section>
    <aside className="inspector" aria-label="Inspector">
      <div className="inspector-tabs" role="tablist">{tabs.map(t => <button type="button" role="tab" key={t.id} aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}{t.id === 'alerts' && alerts.data && <b>{alerts.data.length}</b>}</button>)}</div>
      <div className="inspector-body">
        {tab === 'entity' && <EntityDetails key={selected} id={selected} onSelect={select} onEgo={(ego, expand) => { showAll(); setFocused(expand && graph ? mergeGraphs(graph, ego) : ego) }} />}
        {tab === 'route' && <PathFinder key={`${from}|${to}`} nodes={nodes} selected={selected} initialFrom={from} initialTo={to} onClear={() => setPath(undefined)} onPath={result => { setFocused(undefined); showAll(); setPath(result); setParams(previous => { previous.delete('highlight'); return previous }) }} />}
        {tab === 'alerts' && <><QueryState error={alerts.error} pending={alerts.isPending} retry={() => alerts.refetch()} />{alerts.data && <AlertsList alerts={alerts.data} names={names} onSelect={alert => { setPath(undefined); setFocused(undefined); showAll(); const next = new URLSearchParams(); alert.entity_ids.forEach(id => next.append('highlight', id)); if (alert.entity_ids[0]) next.set('entity', alert.entity_ids[0]); setParams(next); setTab('entity') }} />}</>}
      </div>
    </aside>
  </div>
}
