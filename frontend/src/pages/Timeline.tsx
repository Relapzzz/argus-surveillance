import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api } from '@/api/client'
import { Bi } from '@/components/Bi'
import { PageTitle } from '@/components/PageTitle'
import { QueryState } from '@/components/QueryState'
import Search, { nodeItems } from '@/components/Search'
import Swimlanes from '@/components/Swimlanes'
import Activity from '@/components/Activity'
import { buttonVariants } from '@/components/ui/button'
import { formatDate, formatLabel, plural } from '@/lib/format'
import { networkUrl, palette, typeNames } from '@/lib/graph'
import { hi } from '@/lib/vocab'
import { buildEvents, busiestDay, dayKey, domain, lanes as laneList, type EventKind, type TimelineEvent } from '@/lib/timeline'
import './timeline.css'

const kinds: { kind: EventKind; name: string }[] = [{ kind: 'call', name: 'Calls' }, { kind: 'transfer', name: 'Money' }, { kind: 'fir', name: 'FIRs' }]
const words: [EventKind, string][] = [['call', 'call'], ['transfer', 'transfer'], ['fir', 'FIR']]
const cap = 12

export default function Timeline() {
  const [params, setParams] = useSearchParams()
  const entity = params.get('entity') ?? ''
  const withId = params.get('with') ?? ''
  const [hidden, setHidden] = useState<EventKind[]>([])
  const [picked, setPicked] = useState('')
  const [all, setAll] = useState(false)

  const graph = useQuery({ queryKey: ['graph'], queryFn: () => api.graph() })
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: api.alerts })
  const players = useQuery({ queryKey: ['key-players'], queryFn: () => api.keyPlayers() })

  const nodes = useMemo(() => new Map((graph.data?.nodes ?? []).map(n => [n.id, n])), [graph.data])
  const events = useMemo(() => graph.data && entity && nodes.has(entity) ? buildEvents(graph.data, entity) : [], [graph.data, nodes, entity])
  const shown = events.filter(event => !hidden.includes(event.kind))
  const rows = graph.data ? laneList(graph.data, shown, withId && nodes.has(withId) ? withId : undefined) : []
  const lanes = all ? rows : rows.slice(0, cap)
  const firs = shown.filter(event => event.kind === 'fir')
  const drawn: TimelineEvent[] = withId ? [...rows.flatMap(row => row.events), ...firs].sort((a, b) => a.at.getTime() - b.at.getTime()) : shown
  const day = drawn.some(event => dayKey(event.at) === picked) ? picked : busiestDay(drawn)
  const counted = words.map(([kind, word]) => [events.filter(e => e.kind === kind).length, word] as const).filter(([n]) => n > 0).map(([n, word]) => plural(n, word))
  const record = counted.length < 2 ? counted.join('') : `${counted.slice(0, -1).join(', ')} and ${counted[counted.length - 1]}`
  const chip = (id: string) => {
    const node = nodes.get(id)
    return node && <><i style={{ background: palette[node.type] }} /><span className="tabular">{formatLabel(node.type, node.label)}</span><small>{typeNames[node.type]}</small></>
  }
  const quick = [...new Set([alerts.data?.find(a => a.type === 'bridge_node')?.entity_ids[0], ...(players.data ?? []).slice(0, 3).map(p => p.entity_id)])].filter((id): id is string => id !== undefined)

  return <div className="page">
    <PageTitle title="Timeline" hi="समयरेखा" description="Every call, transfer and FIR for one person, phone or account, laid out in time." />
    <QueryState pending={graph.isPending} error={graph.error} retry={() => graph.refetch()} />
    {graph.data && <>
      <div className="picker">
        <div className="pick">
          <span className="pick-label">Whose timeline</span>
          {entity && nodes.has(entity)
            ? <span className="picked">{chip(entity)}<button aria-label="Clear the person" onClick={() => setParams({})}><X size={14} /></button></span>
            : <Search items={nodeItems(graph.data.nodes)} label="Whose timeline" placeholder="Name, phone number or account" onPick={item => setParams({ entity: item.id })} />}
        </div>
        <div className="pick">
          <span className="pick-label">With</span>
          {withId && nodes.has(withId)
            ? <span className="picked">{chip(withId)}<button aria-label="Clear the pair" onClick={() => setParams({ entity })}><X size={14} /></button></span>
            : <Search items={nodeItems(graph.data.nodes)} label="With" placeholder="Narrow to one contact" onPick={item => setParams({ entity, with: item.id })} />}
        </div>
        <div className="seg" role="group" aria-label="What to show">
          {kinds.map(({ kind, name }) => <button key={kind} aria-pressed={!hidden.includes(kind)} onClick={() => setHidden(was => was.includes(kind) ? was.filter(k => k !== kind) : [...was, kind])}>{name}</button>)}
        </div>
      </div>

      {!entity || !nodes.has(entity) ? <div className="empty">
        <h2>Pick a person, phone or account</h2>
        <p>Search above and their calls, transfers and FIRs line up on one chart. Start with someone the records already point at.</p>
        <div className="chips">{quick.map(id => <button key={id} onClick={() => setParams({ entity: id })}><i style={{ background: palette[nodes.get(id)?.type ?? 'person'] }} />{nodes.get(id)?.label ?? id}</button>)}</div>
      </div> : !events.length ? <p className="empty">No calls, transfers or FIRs on record for {nodes.get(entity)?.label}.</p> : <>
        <section className="section" aria-label="Chart">
          <div className="section-head"><h2>Contacts over time</h2><p>{rows.length ? `${plural(rows.length, 'contact')}, busiest first. ` : ''}Click a mark to read that day.</p></div>
          {drawn.length
            ? <Swimlanes lanes={lanes} firs={firs} span={domain(drawn)} day={day} onPickDay={setPicked} summary={`${record} for ${nodes.get(entity)?.label}, drawn as one row per contact. The list below gives every event of the selected day in words.`} />
            : <p className="empty">Nothing left to draw. Switch a kind back on.</p>}
          {rows.length > cap && <button className="text-button swim-more" onClick={() => setAll(!all)}>{all ? `Show the busiest ${cap}` : `Show all ${rows.length} contacts`}</button>}
        </section>
        <section className="section" aria-label="Selected day">
          <div className="section-head"><h2>{day ? formatDate(day + 'T00:00:00') : 'That day'}</h2><p className="kicker">What happened, in order</p></div>
          <Activity graph={graph.data} events={drawn} day={day} />
        </section>
        <p className="timeline-foot">{record} between {formatDate(events[0].at.toISOString())} and {formatDate(events[events.length - 1].at.toISOString())}.</p>
        <div className="actions"><Link className={buttonVariants({ size: 'lg' })} to={networkUrl(withId ? [entity, withId] : [entity])}><Bi en="Show on network" hi={hi.showOnNetwork} /></Link></div>
      </>}
    </>}
  </div>
}
