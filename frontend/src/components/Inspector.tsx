import { useMemo } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { GraphResponse, RelationshipType } from '@/api/types'
import { formatLabel } from '@/lib/format'
import { caseUrl, groupColor, groupName, groupNames, mapUrl, palette, profileUrl, timelineUrl, typeNames } from '@/lib/graph'
import { firsOf, identifiersOf, ownedBy, ownerOf } from '@/lib/profile'
import { hi } from '@/lib/vocab'
import { whyInOneLine } from '@/lib/why'
import { Bi } from './Bi'
import { QueryState } from './QueryState'
import { Button, buttonVariants } from './ui/button'

const relationWords: Record<RelationshipType, string> = { called: 'called', transacted: 'money moved', co_accused: 'co-accused', owns: 'owns', resides_at: 'lives at', seen_at: 'seen at', member_of: 'member of', mentioned_in: 'named in', associate_of: 'associate of' }

export default function EntityDetails({ id, onSelect, onEgo }: { id?: string; onSelect: (id: string) => void; onEgo: (graph: GraphResponse, expand: boolean) => void }) {
  const query = useQuery({ queryKey: ['entity', id], queryFn: () => api.entity(id!), enabled: Boolean(id) })
  const graph = useQuery({ queryKey: ['graph'], queryFn: () => api.graph() })
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: api.alerts })
  const players = useQuery({ queryKey: ['key-players'], queryFn: () => api.keyPlayers() })
  const cases = useQuery({ queryKey: ['cases'], queryFn: api.cases })
  const ego = useMutation({ mutationFn: async (expand: boolean) => ({ graph: await api.ego(id!), expand }), onSuccess: ({ graph, expand }) => onEgo(graph, expand) })
  const names = useMemo(() => graph.data ? groupNames(graph.data) : undefined, [graph.data])
  if (!id) return <div className="inspector-empty"><h2>Nothing selected</h2><p>Click an entity on the board, or search for a name, phone number, account or plate. This panel says who they are, why they matter and who they touch.</p></div>
  const detail = query.data
  const g = graph.data
  const entity = detail?.entity
  const owned = g ? ownedBy(g, id) : []
  const owner = g ? ownerOf(g, id) : undefined
  const firs = g && cases.data ? firsOf(g, cases.data, id) : []
  const aliases = Array.isArray(entity?.attributes.aliases) ? entity.attributes.aliases as string[] : []
  return <div className="entity">
    <QueryState pending={query.isPending} error={query.error} retry={() => query.refetch()} />
    {detail && entity && <>
      <p className="entity-kind"><i style={{ background: palette[entity.type] }} />{typeNames[entity.type]}<span className="group-chip"><i style={{ background: groupColor(detail.metrics.community) }} />{groupName(names, detail.metrics.community)}</span></p>
      <h2 className="entity-name display tabular">{formatLabel(entity.type, entity.label)}</h2>
      {aliases.length > 0 && <p className="entity-alias">alias {aliases.join(', ')}</p>}
      {g && <p className="entity-why">{whyInOneLine({ entity, identifiers: identifiersOf(g, id), player: players.data?.find(p => p.entity_id === id), alerts: alerts.data, firs, names })}</p>}
      <div className="actions"><Link className={buttonVariants()} to={profileUrl(id)}><Bi en="Open full profile" hi={hi.openProfile} /></Link><Link className={buttonVariants({ variant: 'outline' })} to={timelineUrl(id)}>Timeline</Link><Link className={buttonVariants({ variant: 'outline' })} to={mapUrl(id)}>Map</Link></div>
      <div className="actions"><Button size="sm" variant="secondary" onClick={() => ego.mutate(false)} disabled={ego.isPending}>Focus neighborhood</Button><Button size="sm" variant="secondary" onClick={() => ego.mutate(true)} disabled={ego.isPending}>Expand neighbors</Button></div>
      <QueryState error={ego.error} />
      {owned.length > 0 && <><h3>Identifiers</h3><div className="chips">{owned.map(n => <button type="button" key={n.id} onClick={() => onSelect(n.id)}><i style={{ background: palette[n.type] }} /><span className="tabular">{formatLabel(n.type, n.label)}</span><small>{typeNames[n.type]}</small></button>)}</div></>}
      {owner && <p className="entity-owner">Used by <button type="button" className="text-button" onClick={() => onSelect(owner.id)}>{owner.label}</button></p>}
      <h3>Connections <span>({detail.neighbors.length})</span></h3>
      <div className="neighbors">{detail.neighbors.map(n => <button type="button" key={n.edge_id} onClick={() => onSelect(n.id)}><i style={{ background: palette[n.type] }} /><span className="tabular">{formatLabel(n.type, n.label)}</span><small>{relationWords[n.relationship]}</small></button>)}</div>
      {!detail.neighbors.length && <p className="muted">No connections.</p>}
      <h3>FIRs</h3>
      {detail.sources.length ? <div className="sources">{detail.sources.map(source => <Link key={source} to={caseUrl(source)}>{source.replace(/^case:/, '')}</Link>)}</div> : <p className="muted">Not named in any FIR. Known only from call, bank and history records.</p>}
    </>}
  </div>
}
