import type { Alert } from '@/api/types'
import { formatDate, formatInr, formatTime, listed, parseTime, plural } from './format'
import { humanize, labelFromId } from './graph'

export const alertNames: Record<Alert['type'], string> = { burst_calls: 'Call burst', structuring: 'Structuring', bridge_node: 'Go-between', night_calls: 'Night calls' }
const questions: Record<Alert['type'], string> = {
  bridge_node: 'Who connects the groups?',
  structuring: 'Where is money being split to stay under the limit?',
  burst_calls: 'Which phones lit up together?',
  night_calls: 'Which phones only work at night?',
}
export const alertQuestion = (type: Alert['type']) => questions[type]
export const alertSubject = (alert: Alert) => ({ entity: alert.entity_ids[0], with: alert.type === 'burst_calls' ? alert.entity_ids[1] : undefined })

const num = (value: unknown) => typeof value === 'number' ? value : 0
const str = (value: unknown) => typeof value === 'string' ? value : ''
const numbers = (value: unknown) => Array.isArray(value) ? value.filter(v => typeof v === 'number') as number[] : []
const hourWord = (hour: number) => hour === 0 ? 'midnight' : hour === 12 ? 'noon' : hour < 12 ? `${hour} am` : `${hour - 12} pm`
const nightWindow = (value: string) => value.split('-').map(part => hourWord(Number(part.slice(0, 2)))).join(' and ')
const dateRange = (from: string, to: string) => {
  const start = parseTime(from).getFullYear() === parseTime(to).getFullYear() ? formatDate(from).replace(/ \d{4}$/, '') : formatDate(from)
  return `${start} to ${formatDate(to)}`
}

export function evidenceSummary(alert: Alert, names?: Map<number, string>) {
  const e = alert.evidence
  if (alert.type === 'burst_calls') return `${plural(num(e.count), 'call')} in ${plural(num(e.window_minutes), 'minute')} on ${formatDate(str(e.start))}, ${formatTime(str(e.start))} to ${formatTime(str(e.end))}`
  if (alert.type === 'structuring') {
    const forwarded = str(e.forwarded_to)
    const moved = forwarded ? `, then ${formatInr(num(e.forwarded_amount))} moved on to account ${labelFromId(forwarded)}` : ''
    return `${plural(num(e.count), 'transfer')} of ${formatInr(num(e.min_amount))} to ${formatInr(num(e.max_amount))} within ${plural(num(e.window_days), 'day')} from ${formatDate(str(e.start))}, ${formatInr(num(e.total_amount))} in all${moved}`
  }
  if (alert.type === 'bridge_node') {
    const groups = numbers(e.communities)
    const between = groups.length ? humanize(`communities ${listed(groups)}`, names) : 'the groups'
    return `${plural(num(e.degree), 'connection')} against a typical ${num(e.median_degree)}, yet every route between ${between} runs through them`
  }
  return `${num(e.night_count)} of ${plural(num(e.count), 'call')} between ${nightWindow(str(e.night_window))}, ${dateRange(str(e.first_seen), str(e.last_seen))}`
}
