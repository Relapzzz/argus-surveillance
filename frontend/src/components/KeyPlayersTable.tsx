import { Link } from 'react-router'
import type { KeyPlayer } from '@/api/types'
import { groupColor, humanize, networkUrl } from '@/lib/graph'

export default function KeyPlayersTable({ players }: { players: KeyPlayer[] }) {
  if (!players.length) return <p className="empty">No people ranked yet.</p>
  const top = Math.max(...players.map(p => p.score))
  return <table className="players"><thead><tr><th>#</th><th>Person</th><th>Score</th><th>Links</th><th>Group</th></tr></thead><tbody>
    {players.map((p, i) => <tr key={p.entity_id}><td className="rank">{String(i + 1).padStart(2, '0')}</td><td className="player"><Link to={networkUrl([p.entity_id])}>{p.label}</Link><p>{humanize(p.reason)}</p></td><td><div className="score"><i><b style={{ width: `${top ? p.score / top * 100 : 0}%` }} /></i>{p.score.toFixed(2)}</div></td><td className="mono">{p.degree}</td><td><span className="group-chip"><i style={{ background: groupColor(p.community) }} />{p.community}</span></td></tr>)}
  </tbody></table>
}
