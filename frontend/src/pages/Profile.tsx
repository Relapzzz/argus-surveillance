import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { EntityType } from '@/api/types'
import { Bi } from '@/components/Bi'
import { QueryState } from '@/components/QueryState'
import { Button, buttonVariants } from '@/components/ui/button'
import { formatCount, formatDate, formatInr, formatLabel, listed, plural } from '@/lib/format'
import { caseUrl, groupColor, groupName, groupNames, mapUrl, networkUrl, palette, profileUrl, routeUrl, timelineUrl, typeNames } from '@/lib/graph'
import { activityOf, associatesOf, firsOf, ownedBy, ownerOf, placesOf, type Associate, type PlaceLink } from '@/lib/profile'
import { hi } from '@/lib/vocab'
import { whyItMatters } from '@/lib/why'
import './profile.css'

const placeLinks: Record<PlaceLink['link'], string> = { home: 'home', seen: 'seen here', 'FIR place': 'FIR place' }

export default function Profile() {
  const { id = '' } = useParams()
  const detail = useQuery({ queryKey: ['entity', id], queryFn: () => api.entity(id) })
  const graph = useQuery({ queryKey: ['graph'], queryFn: () => api.graph() })
  const cases = useQuery({ queryKey: ['cases'], queryFn: api.cases })
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: api.alerts })
  const players = useQuery({ queryKey: ['key-players'], queryFn: () => api.keyPlayers() })
  const names = useMemo(() => graph.data && groupNames(graph.data), [graph.data])

  if (detail.error) return <div className="page"><div className="empty"><h2>{detail.error.message}</h2><Link className="text-button" to="/">Back to the overview</Link></div></div>
  if (!detail.data) return <div className="page"><QueryState pending /></div>

  const { entity, metrics } = detail.data
  const type: EntityType = entity.type
  const aliases = Array.isArray(entity.attributes.aliases) ? entity.attributes.aliases as string[] : []
  const address = typeof entity.attributes.address === 'string' ? entity.attributes.address : undefined
  const owner = graph.data && ownerOf(graph.data, id)
  const owned = graph.data ? ownedBy(graph.data, id) : []
  const places = graph.data ? placesOf(graph.data, id) : []
  const firs = graph.data && cases.data ? firsOf(graph.data, cases.data, id) : []
  const associates = graph.data && associatesOf(graph.data, id)
  const activity = graph.data && activityOf(graph.data, id)
  const identifiers = [id, ...owned.map(n => n.id)]
  const why = whyItMatters({ entity, identifiers, player: players.data?.find(p => p.entity_id === id), alerts: alerts.data, firs, names })
  const groups: [string, Associate[]][] = associates
    ? [['Co-accused', associates.coAccused], ['Associates', associates.associates], ['Called with', associates.called], ['Money moved with', associates.money]]
    : []

  return <div className="page profile">
    <title>{`${entity.label}, VYUHA`}</title>
    <header className="profile-head">
      <p className="kicker"><span>{typeNames[type]}</span><span className="group-chip"><i style={{ background: groupColor(metrics.community) }} />{groupName(names, metrics.community)}</span></p>
      <h1 className="display">{formatLabel(type, entity.label)}</h1>
      {aliases.length > 0 && <p className="alias">alias {listed(aliases)}</p>}
      {owner && <p className="alias">Used by <Link to={profileUrl(owner.id)}>{owner.label}</Link></p>}
      <div className="actions">
        <Link className={buttonVariants({ size: 'lg' })} to={networkUrl([id])}><Bi en="Show on network" hi={hi.showOnNetwork} /></Link>
        <Link className={buttonVariants({ size: 'lg', variant: 'outline' })} to={routeUrl(id, '')}><Bi en="Trace a route from here" hi={hi.traceRoute} /></Link>
        <Link className={buttonVariants({ variant: 'outline' })} to={timelineUrl(id)}>Timeline</Link>
        <Link className={buttonVariants({ variant: 'outline' })} to={mapUrl(id)}>Map</Link>
        <Button variant="ghost" onClick={() => window.print()}><Bi en="Print" hi={hi.print} /></Button>
      </div>
    </header>

    <section className="section">
      <div className="section-head"><h2>Why this matters</h2></div>
      <p className="why">{why.join(' ')}</p>
    </section>

    <section className="section">
      <div className="section-head"><h2>Identifiers and places</h2></div>
      <QueryState pending={graph.isPending} error={graph.error} retry={() => graph.refetch()} />
      {address && <p className="line">{address}</p>}
      {owned.length > 0 && <div className="chips">{owned.map(n => <Link key={n.id} to={profileUrl(n.id)}><i style={{ background: palette[n.type] }} />{formatLabel(n.type, n.label)}<small>{typeNames[n.type].toLowerCase()}</small></Link>)}</div>}
      {places.length > 0 && <div className="chips places">{places.map(p => <Link key={p.node.id} to={profileUrl(p.node.id)}><i style={{ background: palette.location }} />{p.node.label}<small>{placeLinks[p.link]}</small></Link>)}</div>}
      {!address && !owned.length && !places.length && graph.data && <p className="line muted">No phones, accounts or places recorded.</p>}
    </section>

    <section className="section">
      <div className="section-head"><h2>FIRs</h2>{firs.length > 0 && <p>{plural(firs.length, 'FIR')}</p>}</div>
      {firs.length > 0
        ? <div className="rows firs">{firs.map(f => <article key={f.case.id}>
          <Link to={caseUrl(f.case.id)}>{f.case.fir_number}</Link>
          <span>{f.case.station} police station</span>
          <span>{f.case.incident_time ? formatDate(f.case.incident_time) : 'Date not recorded'}</span>
          {f.role && <span className="role">{f.role}</span>}
        </article>)}</div>
        : <p className="line muted">Not named in any FIR.</p>}
    </section>

    {associates && <section className="section">
      <div className="section-head"><h2>Associates</h2></div>
      {groups.every(([, entries]) => !entries.length) && <p className="line muted">No one is linked to this entity yet.</p>}
      {groups.filter(([, entries]) => entries.length).map(([label, entries]) => <div className="associate-group" key={label}>
        <h3>{label}</h3>
        <div className="chips">{entries.map(a => <Link key={a.node.id} to={profileUrl(a.node.id)}>
          <i style={{ background: groupColor(a.community) }} />{formatLabel(a.node.type, a.node.label)}<small>{formatCount(a.count)}</small>
        </Link>)}</div>
      </div>)}
    </section>}

    {activity && <section className="section">
      <div className="section-head"><h2>Activity</h2></div>
      <p className="line">
        {activity.calls > 0 ? plural(activity.calls, 'call') : 'No calls recorded'}
        {activity.firstSeen && activity.lastSeen ? ` between ${formatDate(activity.firstSeen)} and ${formatDate(activity.lastSeen)}.` : '.'}
        {(activity.moneyIn > 0 || activity.moneyOut > 0) && ` ${formatInr(activity.moneyIn)} received, ${formatInr(activity.moneyOut)} sent.`}
      </p>
    </section>}

    <details className="numbers">
      <summary>Show the numbers</summary>
      <dl>
        <div><dt>Connections<small>How many phones, people, accounts and places link to this entity.</small></dt><dd>{formatCount(metrics.degree)}</dd></div>
        <div><dt>Bridging<small>How often this entity sits on the shortest route between two others. High bridging with few connections means a go-between.</small></dt><dd>{metrics.betweenness.toFixed(3)}</dd></div>
        <div><dt>Influence<small>How much of the network&apos;s attention flows here.</small></dt><dd>{metrics.pagerank.toFixed(4)}</dd></div>
      </dl>
    </details>
  </div>
}
