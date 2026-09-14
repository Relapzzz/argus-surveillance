import { ArrowUpRight } from 'lucide-react'
import type { Alert } from '@/api/types'
import { humanize } from '@/lib/graph'

export const alertNames: Record<Alert['type'], string> = { burst_calls: 'Call burst', structuring: 'Structuring', bridge_node: 'Go-between', night_calls: 'Night calls' }
export default function AlertsList({ alerts, onSelect }: { alerts: Alert[]; onSelect: (alert: Alert) => void }) {
  if (!alerts.length) return <p className="empty">No patterns flagged in this network.</p>
  return <div className="alerts">{alerts.map(alert => <article className="alert" key={alert.id}>
    <div className="alert-top"><span className={`sev ${alert.severity}`}>{alert.severity}</span><span>{alertNames[alert.type]}</span></div>
    <button className="alert-title" onClick={() => onSelect(alert)}>{humanize(alert.title)}<ArrowUpRight size={14} /></button>
    <p>{humanize(alert.description)}</p>
    <details><summary>Evidence</summary><dl className="kv">{Object.entries(alert.evidence).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl></details>
  </article>)}</div>
}
