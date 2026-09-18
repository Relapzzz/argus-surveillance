import { useMemo } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { entityTypes } from '@/api/types'
import { Bi } from '@/components/Bi'
import GroupFolders from '@/components/GroupFolders'
import Leads from '@/components/Leads'
import PeopleList from '@/components/PeopleList'
import Pipeline from '@/components/Pipeline'
import StartWith from '@/components/StartWith'
import { PageTitle } from '@/components/PageTitle'
import { QueryState } from '@/components/QueryState'
import { buttonVariants } from '@/components/ui/button'
import { formatCount } from '@/lib/format'
import { groupNames, networkUrl, palette, typeNames } from '@/lib/graph'
import { guideTasks } from '@/lib/guide'
import { hi } from '@/lib/vocab'
import './overview.css'

export default function Overview() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats })
  const graph = useQuery({ queryKey: ['graph'], queryFn: () => api.graph() })
  const cases = useQuery({ queryKey: ['cases'], queryFn: api.cases })
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: api.alerts })
  const players = useQuery({ queryKey: ['key-players'], queryFn: () => api.keyPlayers() })
  const firstId = cases.data?.[0]?.id
  const firstCase = useQuery({ queryKey: ['case', firstId], queryFn: () => api.case(firstId!), enabled: Boolean(firstId) })
  const bridge = alerts.data?.find(a => a.type === 'bridge_node')
  const bridgeId = bridge?.entity_ids[0]
  const bridgeEntity = useQuery({ queryKey: ['entity', bridgeId], queryFn: () => api.entity(bridgeId!), enabled: Boolean(bridgeId) })
  const names = useMemo(() => graph.data && groupNames(graph.data), [graph.data])

  const s = stats.data
  const total = s ? Object.values(s.entities).reduce((a, b) => a + b, 0) : 0
  const stations = cases.data ? new Set(cases.data.map(c => c.station)).size : 0
  const groups = graph.data ? new Set(graph.data.nodes.filter(n => n.type === 'person').map(n => n.metrics.community)).size : 0
  const sharedFir = useMemo(() => {
    if (!graph.data) return false
    const community = new Map(graph.data.nodes.map(n => [n.id, n.type === 'person' ? n.metrics.community : undefined]))
    const perCase = new Map<string, Set<number>>()
    for (const e of graph.data.edges) {
      if (e.type !== 'mentioned_in') continue
      const [person, record] = e.source.startsWith('case:') ? [e.target, e.source] : [e.source, e.target]
      const group = community.get(person)
      if (group !== undefined) perCase.set(record, (perCase.get(record) ?? new Set()).add(group))
    }
    return [...perCase.values()].some(set => set.size > 1)
  }, [graph.data])
  const tasks = guideTasks({ alerts: alerts.data, players: players.data, cases: cases.data, firstCase: firstCase.data, graph: graph.data })

  return <div className="page overview">
    <PageTitle title="Overview" hi="अवलोकन" description="What the records say, and where to look next." />
    <QueryState pending={stats.isPending} error={stats.error} retry={() => stats.refetch()} />

    {s && total === 0 && <section className="section">
      <div className="section-head"><h2>No records yet</h2><p>This workspace is empty.</p></div>
      <ol className="start-steps">
        <li><b>1</b><span>Add an FIR as a .txt file. People, phones, vehicles, places and organizations are read out of the narrative.</span></li>
        <li><b>2</b><span>Add call records and bank transfers as .csv files. Phones and accounts are matched to the people who own them.</span></li>
        <li><b>3</b><span>Come back here. Groups, key people and suspicious patterns appear as soon as the records connect.</span></li>
      </ol>
      <div className="actions"><Link className={buttonVariants({ size: 'lg' })} to="/ingest"><Bi en="Add records" hi={hi.addRecords} /></Link></div>
    </section>}

    {s && total > 0 && <>
      <section className="brief" aria-label="The finding">
        <p className="brief-text">
          {s.cases > 0 && <><b>{formatCount(s.cases)}</b> {s.cases === 1 ? 'FIR' : 'FIRs'}{stations > 0 && <> from <b>{formatCount(stations)}</b> police {stations === 1 ? 'station' : 'stations'}</>}.{' '}</>}
          <b>{formatCount(total)}</b> people, phones, accounts and places
          {s.relationships > 0 ? <>, linked by <b>{formatCount(s.relationships)}</b> relationships.</> : <>, not linked to each other yet.</>}
          {groups === 1 && <> One group so far.</>}
          {groups > 1 && <> <b>{formatCount(groups)}</b> groups{!sharedFir && <> that never share an FIR</>}
            {bridgeEntity.data
              ? <>, and one person every route between them runs through: <Link to={networkUrl(bridge!.entity_ids)}>{bridgeEntity.data.entity.label}</Link>.</>
              : <>, with no single go-between yet.</>}
          </>}
        </p>
      </section>

      <section className="section">
        <div className="section-head"><h2>How this picture was built</h2><p>Every number comes from the records, in the order they are read.</p></div>
        <Pipeline stats={s} graph={graph.data} />
      </section>

      <section className="section">
        <div className="section-head"><h2>Start with</h2><p>Three moves that show the most in the least time.</p></div>
        <StartWith tasks={tasks.slice(0, 3)} />
      </section>

      <section className="section">
        <div className="section-head"><h2>People who matter</h2><p>Ranked by how much of the network runs through them.</p></div>
        <QueryState pending={players.isPending} error={players.error} retry={() => players.refetch()} />
        {players.data && <PeopleList players={players.data} graph={graph.data} alerts={alerts.data} names={names} />}
      </section>

      <section className="section">
        <div className="section-head"><h2>Leads</h2><p>What the patterns are asking you to check.</p></div>
        <QueryState pending={alerts.isPending} error={alerts.error} retry={() => alerts.refetch()} />
        {alerts.data && <Leads alerts={alerts.data} names={names} />}
      </section>

      <section className="section">
        <div className="section-head"><h2>Groups</h2><p>People who call, pay and offend together, named after where they live.</p></div>
        <QueryState pending={graph.isPending} error={graph.error} retry={() => graph.refetch()} />
        {graph.data && <GroupFolders graph={graph.data} names={names} />}
      </section>

      <section className="section">
        <div className="section-head"><h2>In the records</h2></div>
        <div className="ledger">{entityTypes.map(t => <span key={t}><i style={{ background: palette[t] }} />{typeNames[t]}<b>{formatCount(s.entities[t])}</b></span>)}</div>
      </section>
    </>}
  </div>
}
