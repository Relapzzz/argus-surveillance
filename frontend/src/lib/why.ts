import type { Alert, Entity, KeyPlayer } from '@/api/types'
import { evidenceSummary } from './alerts'
import { listed, plural } from './format'
import { humanize } from './graph'
import type { Fir } from './profile'

export interface WhyInput {
  entity: Pick<Entity, 'id' | 'label'>
  identifiers?: string[]
  player?: KeyPlayer
  alerts?: Alert[]
  firs?: Fir[]
  names?: Map<number, string>
}
const leadIn: Record<Alert['type'], string> = {
  burst_calls: 'A burst of calls',
  night_calls: 'Calls almost only at night',
  structuring: 'Money split to stay under the limit',
  bridge_node: 'A route between the groups',
}

function playerSentence(reason: string, names?: Map<number, string>) {
  const connects = reason.match(/^bridges (communities .+)$/)
  if (connects) return `Connects ${humanize(connects[1], names)}.`
  const connected = reason.match(/^most connected in (community \d+)$/)
  if (connected) return `The most connected person in ${humanize(connected[1], names)}.`
  const influence = reason.match(/^high influence in (community \d+)$/)
  if (influence) return `One of the most influential people in ${humanize(influence[1], names)}.`
  const text = humanize(reason, names)
  return text.charAt(0).toUpperCase() + text.slice(1) + '.'
}

export function whyItMatters({ entity, identifiers, player, alerts = [], firs = [], names }: WhyInput) {
  const ids = new Set(identifiers ?? [entity.id])
  const mine = alerts.filter(a => a.entity_ids.some(id => ids.has(id)))
  const sentences: string[] = []
  const bridge = mine.find(a => a.type === 'bridge_node' && a.entity_ids[0] === entity.id)
  if (bridge) {
    const groups = Array.isArray(bridge.evidence.communities) ? bridge.evidence.communities as number[] : []
    const between = groups.length ? humanize(`communities ${listed(groups)}`, names) : 'the groups'
    sentences.push(`${entity.label} is the only route between ${between}: ${plural(Number(bridge.evidence.degree), 'connection')}, yet every path between the groups runs through them.`)
  }
  if (player) sentences.push(playerSentence(player.reason, names))
  const roles = [...new Set(firs.map(f => f.role).filter(role => typeof role === 'string'))]
  if (firs.length) sentences.push(`Named in ${plural(firs.length, 'FIR')}${roles.length ? ` as ${listed(roles)}` : ''}.`)
  else sentences.push('Not named in any FIR. Known only from call, bank and history records.')
  for (const alert of mine) {
    if (alert === bridge) continue
    sentences.push(`${leadIn[alert.type]}: ${evidenceSummary(alert, names)}.`)
  }
  return sentences
}

export const whyInOneLine = (input: WhyInput) => whyItMatters(input)[0]
