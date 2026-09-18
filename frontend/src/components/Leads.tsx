import { Link } from 'react-router'
import type { Alert } from '@/api/types'
import { alertQuestion, alertSubject, evidenceSummary } from '@/lib/alerts'
import { humanize, mapUrl, networkUrl, timelineUrl } from '@/lib/graph'

const order: Alert['type'][] = ['bridge_node', 'structuring', 'burst_calls', 'night_calls']

export default function Leads({ alerts, names, detailed = false }: { alerts: Alert[]; names?: Map<number, string>; detailed?: boolean }) {
  if (!alerts.length) return <p className="empty">No patterns flagged yet. Add call or transaction records to look for more.</p>
  const present = order.filter(type => alerts.some(a => a.type === type))
  return <div className="leads">{present.map(type => <section key={type}>
    <h3>{alertQuestion(type)}</h3>
    {alerts.filter(a => a.type === type).map(alert => {
      const subject = alertSubject(alert)
      return <div className="lead-item" key={alert.id}>
        <p className="lead-title"><span className={`sev ${alert.severity}`}>{alert.severity}</span>{humanize(alert.title, names)}</p>
        <p className="lead-evidence">{evidenceSummary(alert, names)}.</p>
        {detailed && <p className="lead-detail">{humanize(alert.description, names)}</p>}
        <p className="lead-links">
          <Link to={networkUrl(alert.entity_ids)}>Show on network</Link>
          <Link to={timelineUrl(subject.entity, subject.with)}>Timeline</Link>
          <Link to={mapUrl(subject.entity)}>Map</Link>
        </p>
      </div>
    })}
  </section>)}</div>
}
