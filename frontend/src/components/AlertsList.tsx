import { useNavigate } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import type { Alert } from '@/api/types'
import { networkUrl } from '@/lib/graph'
import { Badge } from './ui/badge'

export default function AlertsList({ alerts, onSelect }: { alerts: Alert[]; onSelect?: (alert: Alert) => void }) {
  const navigate = useNavigate()
  if (!alerts.length) return <p className="empty">No alerts in this network.</p>
  return <div className="alerts-list">{alerts.map(alert => <article className="alert-item" key={alert.id}>
    <div className="alert-meta"><Badge variant="outline" className={`severity ${alert.severity}`}>{alert.severity}</Badge><span>{alert.type.replaceAll('_', ' ')}</span></div>
    <button className="alert-title" onClick={() => onSelect ? onSelect(alert) : navigate(networkUrl(alert.entity_ids))}>{alert.title}<ArrowUpRight size={15} /></button>
    <p>{alert.description}</p><details><summary>View evidence</summary><dl className="evidence">{Object.entries(alert.evidence).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl></details>
  </article>)}</div>
}
