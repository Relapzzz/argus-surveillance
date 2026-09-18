import { Link } from 'react-router'
import type { GraphResponse } from '@/api/types'
import { formatInr, formatLabel, formatTime } from '@/lib/format'
import { caseUrl, profileUrl } from '@/lib/graph'
import { actors, dayKey, type TimelineEvent } from '@/lib/timeline'

export default function Activity({ graph, events, day }: { graph: GraphResponse; events: TimelineEvent[]; day: string }) {
  const actorOf = actors(graph)
  const today = events.filter(event => dayKey(event.at) === day)
  if (!today.length) return <p className="empty">Nothing on this day. Pick a mark on the chart.</p>
  return <ol className="rows activity">{today.map((event, index) => {
    if (event.kind === 'fir') return <li key={index}><span className="tabular">{formatTime(event.at.toISOString())}</span><span>Named in <Link to={caseUrl(event.caseId)}>{event.firNumber}</Link>, {event.station}</span></li>
    const node = actorOf(event.counterpart)
    const who = <Link to={profileUrl(node.id)}>{formatLabel(node.type, node.label)}</Link>
    return <li key={index}><span className="tabular">{formatTime(event.at.toISOString())}</span>
      <span>{event.kind === 'call'
        ? <>Called {who}{event.cell && <> near {event.cell} tower</>}</>
        : event.direction === 'in' ? <>Received {formatInr(event.amount)} from {who}</> : <>Sent {formatInr(event.amount)} to {who}</>}</span>
    </li>
  })}</ol>
}
