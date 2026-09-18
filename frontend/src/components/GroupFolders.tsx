import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import type { GraphResponse } from '@/api/types'
import { listed, plural } from '@/lib/format'
import { groupColor, groupName, networkUrl, profileUrl } from '@/lib/graph'

export default function GroupFolders({ graph, names }: { graph: GraphResponse; names?: Map<number, string> }) {
  const byId = new Map(graph.nodes.map(n => [n.id, n]))
  const groups = [...new Set(graph.nodes.filter(n => n.type === 'person').map(n => n.metrics.community))].sort((a, b) => a - b)
  if (!groups.length) return <p className="empty">No groups yet. Groups appear once people share calls, money or FIRs.</p>
  return <div className="folders">{groups.map(id => {
    const members = graph.nodes.filter(n => n.metrics.community === id)
    const people = members.filter(n => n.type === 'person')
    const leader = [...people].sort((a, b) => b.metrics.pagerank - a.metrics.pagerank)[0]
    const homes = new Map<string, number>()
    for (const edge of graph.edges) {
      if (edge.type !== 'resides_at') continue
      const a = byId.get(edge.source)!, b = byId.get(edge.target)!
      const [person, place] = a.type === 'location' ? [b, a] : [a, b]
      if (person.type !== 'person' || place.type !== 'location' || person.metrics.community !== id) continue
      homes.set(place.label, (homes.get(place.label) ?? 0) + 1)
    }
    const areas = [...homes].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([label]) => label)
    return <article className="folder" key={id} data-tab={groupName(names, id)} style={{ '--g': groupColor(id) } as CSSProperties}>
      <p>{plural(people.length, 'person', 'people')}, {plural(members.filter(n => n.type === 'phone').length, 'phone')} and {plural(members.filter(n => n.type === 'account').length, 'account')}.</p>
      <p>Most influential: <Link to={profileUrl(leader.id)}>{leader.label}</Link>.</p>
      {areas.length > 0 && <p className="muted">Lives around {listed(areas)}.</p>}
      <p><Link className="text-button" to={networkUrl([leader.id])}>Show on network</Link></p>
    </article>
  })}</div>
}
