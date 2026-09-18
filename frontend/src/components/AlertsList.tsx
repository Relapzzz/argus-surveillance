import { Link } from 'react-router'
import type { Alert } from '@/api/types'
import { alertNames, alertSubject, evidenceSummary } from '@/lib/alerts'
import { humanize, mapUrl, timelineUrl } from '@/lib/graph'

export default function AlertsList({ alerts, names, onSelect }: { alerts: Alert[]; names?: Map<number, string>; onSelect: (alert: Alert) => void }) {
  if (!alerts.length) return <p className="empty">No patterns flagged in these records.</p>
  return <div className="alerts">{alerts.map(alert => {
    const subject = alertSubject(alert)
    return <article className="alert" key={alert.id}>
      <div className="alert-top"><span className={`sev ${alert.severity}`}>{alert.severity}</span><span>{alertNames[alert.type]}</span></div>
      <button type="button" className="alert-title" onClick={() => onSelect(alert)}>{humanize(alert.title, names)}</button>
      <p>{evidenceSummary(alert, names)}.</p>
      <p className="alert-links"><button type="button" className="text-button" onClick={() => onSelect(alert)}>Show on network</button><Link to={timelineUrl(subject.entity, subject.with)}>Timeline</Link><Link to={mapUrl(subject.entity)}>Map</Link></p>
    </article>
  })}</div>
}
