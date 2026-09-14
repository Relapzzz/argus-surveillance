import { Link } from 'react-router'
import type { KeyPlayer } from '@/api/types'
import { networkUrl } from '@/lib/graph'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

export default function KeyPlayersTable({ players }: { players: KeyPlayer[] }) {
  const maximum = Math.max(...players.map(p => p.score), 0)
  if (!players.length) return <p className="empty">No ranked persons yet.</p>
  return <Table className="players-table"><TableHeader><TableRow><TableHead>Rank / Entity</TableHead><TableHead>Score</TableHead><TableHead>Connections</TableHead></TableRow></TableHeader><TableBody>{players.map((p, i) => <TableRow key={p.entity_id}><TableCell><div className="player-name"><span className="rank">{String(i + 1).padStart(2, '0')}</span><div><Link to={networkUrl([p.entity_id])}>{p.label}</Link><p>{p.reason}</p></div></div></TableCell><TableCell><span className="mono">{p.score.toFixed(4)}</span><div className="score-track"><span style={{ width: `${maximum ? p.score / maximum * 100 : 0}%` }} /></div></TableCell><TableCell className="mono">{p.degree}</TableCell></TableRow>)}</TableBody></Table>
}
