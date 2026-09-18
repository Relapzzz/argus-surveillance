import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { api } from '@/api/client'
import { entityTypes } from '@/api/types'
import { PageTitle } from '@/components/PageTitle'
import { QueryState } from '@/components/QueryState'
import KeyPlayersTable from '@/components/KeyPlayersTable'
import Leads from '@/components/Leads'
import { buttonVariants } from '@/components/ui/button'
import { groupColor, labelFromId, networkUrl, palette, typeNames } from '@/lib/graph'

const listed = (items: (string | number)[]) => items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

export default function Briefing() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats })
  const players = useQuery({ queryKey: ['key-players'], queryFn: () => api.keyPlayers() })
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: api.alerts })
  const communities = useQuery({ queryKey: ['communities'], queryFn: api.communities })
  const bridge = alerts.data?.find(a => a.type === 'bridge_node')
  const bridgeId = bridge?.entity_ids[0]
  const bridgeEntity = useQuery({ queryKey: ['entity', bridgeId], queryFn: () => api.entity(bridgeId!), enabled: Boolean(bridgeId) })
  const s = stats.data
  const total = s ? Object.values(s.entities).reduce((a, b) => a + b, 0) : 0
  const largest = communities.data ? [...communities.data].sort((a, b) => b.size - a.size).slice(0, 2) : []
  return <div className="page">
    <PageTitle title="Overview" hi="अवलोकन" description="What the records say, and where to look next."><Link className={buttonVariants({ size: 'lg' })} to="/network">Open the network<ArrowUpRight data-icon="inline-end" /></Link></PageTitle>
    <QueryState pending={stats.isPending} error={stats.error} retry={() => stats.refetch()} />
    {s && total === 0 && <section className="panel start" aria-label="Getting started"><div className="panel-head"><div><h2>No records yet</h2><p>This workspace is empty. Add the first record and the briefing writes itself.</p></div></div>
      <ol className="start-steps"><li><b>1</b><span>Add an FIR as a .txt file. People, phones, vehicles, places and organizations are extracted from the narrative.</span></li><li><b>2</b><span>Add call detail records and bank transactions as .csv files. Phones and accounts are matched to the people who own them.</span></li><li><b>3</b><span>Come back here. Groups, key players and suspicious patterns appear as soon as the records connect.</span></li></ol>
      <div className="start-cta"><Link className={buttonVariants({ size: 'lg' })} to="/ingest">Add the first record<ArrowUpRight data-icon="inline-end" /></Link></div>
    </section>}
    {s && total > 0 && <section className="brief" aria-label="Summary">
      <p className="brief-kicker">Synthetic corpus · Pune City · {s.cases} FIRs with call and transaction records</p>
      <p className="brief-text">
        <b>{s.cases}</b> FIRs and their call and transaction records resolve into <b>{total}</b> linked entities and <b>{s.relationships.toLocaleString('en-IN')}</b> relationships.
        {communities.data && communities.data.length > 1 && <> The network falls into <b>{communities.data.length}</b> groups, the largest holding <b>{largest[0].size}</b> and <b>{largest[1].size}</b> entities.</>}
        {bridge && bridgeEntity.data && <> <Link to={networkUrl(bridge.entity_ids)}>{bridgeEntity.data.entity.label}</Link> is the go-between: only <b>{String(bridge.evidence.degree)}</b> connections, yet the route between groups {listed((bridge.evidence.communities as number[] | undefined) ?? [])} runs through them.</>}
        {' '}<b>{s.alerts}</b> {s.alerts === 1 ? 'pattern needs' : 'patterns need'} a closer look.
      </p>
    </section>}
    {s && total > 0 && <div className="ledger">{entityTypes.map(t => <span key={t}><i style={{ background: palette[t] }} />{typeNames[t]}<b>{s.entities[t]}</b></span>)}</div>}
    {total > 0 && <>
    <div className="brief-grid">
      <section className="panel"><div className="panel-head"><div><h2>Key players</h2><p>People ranked by influence, by how many routes pass through them, and by connections</p></div></div><QueryState pending={players.isPending} error={players.error} retry={() => players.refetch()} />{players.data && <KeyPlayersTable players={players.data} />}</section>
      <section className="panel"><div className="panel-head"><div><h2>Where to look next</h2><p>Patterns the rules flagged, as investigative questions</p></div>{alerts.data && <span className="count">{alerts.data.length}</span>}</div><QueryState pending={alerts.isPending} error={alerts.error} retry={() => alerts.refetch()} />{alerts.data && <Leads alerts={alerts.data} />}</section>
    </div>
    <section className="groups-section"><div className="panel-head"><div><h2>Groups</h2><p>Communities of closely connected people, phones and accounts, found with Louvain clustering</p></div></div>
      <QueryState pending={communities.isPending} error={communities.error} retry={() => communities.refetch()} />
      <div className="groups">{communities.data?.map(c => <article className="group" key={c.id} style={{ '--g': groupColor(c.id) } as React.CSSProperties}><h3>Group {c.id}<span>{c.size} entities</span></h3><p>Most influential: <Link to={networkUrl([c.top_member])}>{labelFromId(c.top_member)}</Link></p></article>)}</div>
      {communities.data?.length === 0 && <p className="empty">No groups yet.</p>}
    </section>
    </>}
  </div>
}
