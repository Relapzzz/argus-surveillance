import { Link } from 'react-router'
import type { Alert, GraphResponse, KeyPlayer } from '@/api/types'
import { plural } from '@/lib/format'
import { groupColor, groupName, profileUrl } from '@/lib/graph'
import { identifiersOf } from '@/lib/profile'
import { whyInOneLine } from '@/lib/why'

export default function PeopleList({ players, graph, alerts = [], names }: { players: KeyPlayer[]; graph?: GraphResponse; alerts?: Alert[]; names?: Map<number, string> }) {
  if (!players.length) return <p className="empty">No people ranked yet. Add call or transaction records to rank them.</p>
  const byId = new Map(graph?.nodes.map(n => [n.id, n]))
  return <div className="rows people">{players.map((player, i) => {
    const node = byId.get(player.entity_id)
    const aliases = node && Array.isArray(node.attributes.aliases) ? node.attributes.aliases as string[] : []
    const ids = new Set(graph ? identifiersOf(graph, player.entity_id) : [player.entity_id])
    const leads = alerts.filter(a => a.entity_ids.some(id => ids.has(id))).length
    return <article key={player.entity_id}>
      <span className="rank numeral">{i + 1}</span>
      <div>
        <p className="person"><Link to={profileUrl(player.entity_id)}>{player.label}</Link>{aliases[0] && <small>alias {aliases[0]}</small>}</p>
        <p className="reason">{whyInOneLine({ entity: { id: player.entity_id, label: player.label }, identifiers: [...ids], player, alerts, names })}</p>
      </div>
      <span className="group-chip"><i style={{ background: groupColor(player.community) }} />{groupName(names, player.community)}</span>
      {leads > 0 && <span className="lead-note">Named in {plural(leads, 'lead')}</span>}
    </article>
  })}</div>
}
