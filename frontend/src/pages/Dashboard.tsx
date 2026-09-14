import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Users, GitBranch, Files, Radio } from 'lucide-react'
import { api } from '@/api/client'
import { PageHeading } from '@/components/PageHeading'
import { QueryState } from '@/components/QueryState'
import KeyPlayersTable from '@/components/KeyPlayersTable'
import AlertsList from '@/components/AlertsList'
import { Card } from '@/components/ui/card'
import { palette, networkUrl } from '@/lib/graph'
import { entityTypes } from '@/api/types'

export default function Dashboard() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats })
  const players = useQuery({ queryKey: ['key-players'], queryFn: () => api.keyPlayers() })
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: api.alerts })
  const communities = useQuery({ queryKey: ['communities'], queryFn: api.communities })
  const counts = stats.data && [{ label: 'Total entities', value: Object.values(stats.data.entities).reduce((a, b) => a + b, 0), icon: Users, note: 'Across seven entity types' }, { label: 'Relationships', value: stats.data.relationships, icon: GitBranch, note: 'Connections across records' }, { label: 'Source cases', value: stats.data.cases, icon: Files, note: 'FIRs in the network' }, { label: 'Pattern alerts', value: stats.data.alerts, icon: Radio, note: 'Signals for investigation' }]
  return <><PageHeading title="Network overview" description="Explore entities, relationships, and signals across your investigation."><Link className="primary-link" to="/network">Explore network <ArrowUpRight size={16} /></Link></PageHeading>
    <QueryState pending={stats.isPending} error={stats.error} retry={() => stats.refetch()} />
    {counts && <div className="stats-grid">{counts.map(({ label, value, icon: Icon, note }) => <Card className="stat-card" key={label}><div><span>{label}</span><Icon size={17} /></div><strong>{value.toLocaleString('en-IN')}</strong><small>{note}</small></Card>)}</div>}
    {stats.data && <div className="entity-breakdown">{entityTypes.map(t => <span key={t}><i style={{ background: palette[t] }} />{t}<b>{stats.data.entities[t]}</b></span>)}</div>}
    <div className="dashboard-grid"><section className="panel"><div className="section-heading"><div><h2>Key players</h2><p>Ranked by network influence</p></div><span className="eyebrow">PERSONS ONLY</span></div><QueryState pending={players.isPending} error={players.error} retry={() => players.refetch()} />{players.data && <KeyPlayersTable players={players.data} />}</section>
      <section className="panel"><div className="section-heading"><div><h2>Pattern alerts</h2><p>Review the evidence behind each signal</p></div>{alerts.data && <span className="count-badge">{alerts.data.length}</span>}</div><QueryState pending={alerts.isPending} error={alerts.error} retry={() => alerts.refetch()} />{alerts.data && <AlertsList alerts={alerts.data} />}</section></div>
    <section className="communities-section"><div className="section-heading"><div><h2>Network communities</h2><p>Groups of closely connected entities</p></div></div><QueryState pending={communities.isPending} error={communities.error} retry={() => communities.refetch()} /><div className="community-grid">{communities.data?.map(c => <Card className="community-card" key={c.id}><div><h3>Community {c.id}</h3><span>{c.size} entities</span></div><p>Top member</p><Link to={networkUrl([c.top_member])}>{c.top_member}<ArrowUpRight size={14} /></Link></Card>)}</div>{communities.data?.length === 0 && <p className="empty">No communities yet.</p>}</section>
  </>
}
