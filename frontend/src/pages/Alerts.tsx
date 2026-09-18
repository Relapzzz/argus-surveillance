import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Alert } from '@/api/types'
import Leads from '@/components/Leads'
import { PageTitle } from '@/components/PageTitle'
import { QueryState } from '@/components/QueryState'
import { alertNames } from '@/lib/alerts'
import { formatCount } from '@/lib/format'
import { groupNames } from '@/lib/graph'
import './alerts.css'

const types: Alert['type'][] = ['bridge_node', 'structuring', 'burst_calls', 'night_calls']
const severities: Alert['severity'][] = ['high', 'medium', 'low']

export default function Alerts() {
  const [params, setParams] = useSearchParams()
  const type = params.get('type'), severity = params.get('severity')
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: api.alerts })
  const graph = useQuery({ queryKey: ['graph'], queryFn: () => api.graph() })
  const names = useMemo(() => graph.data ? groupNames(graph.data) : undefined, [graph.data])
  const all = alerts.data ?? []
  const shown = all.filter(a => (!type || a.type === type) && (!severity || a.severity === severity))
  const toggle = (key: string, value: string) => setParams(previous => { if (previous.get(key) === value) previous.delete(key); else previous.set(key, value); return previous })
  return <div className="page">
    <PageTitle title="Alerts" hi="अलर्ट" description="Patterns the rules flagged for a closer look, each with its evidence in plain words." />
    <QueryState pending={alerts.isPending} error={alerts.error} retry={() => alerts.refetch()} />
    {all.length > 0 && <div className="filters" role="group" aria-label="Filter alerts">
      {types.map(t => <button type="button" key={t} aria-pressed={type === t} onClick={() => toggle('type', t)}>{alertNames[t]}<b>{formatCount(all.filter(a => a.type === t).length)}</b></button>)}
      <span className="filters-gap" aria-hidden="true" />
      {severities.map(s => <button type="button" key={s} className={`sev-filter ${s}`} aria-pressed={severity === s} onClick={() => toggle('severity', s)}>{s}</button>)}
    </div>}
    {all.length > 0 && <p className="alerts-count">{shown.length === all.length ? `All ${formatCount(all.length)} alerts` : `${formatCount(shown.length)} of ${formatCount(all.length)} alerts`}</p>}
    {alerts.data && (all.length ? <Leads alerts={shown} names={names} detailed /> : <div className="empty"><h2>No patterns flagged yet</h2><p>Add call records or bank transfers and the rules look for bursts, night calls, structuring and go-betweens.</p></div>)}
  </div>
}
