import type { Alert, CaseDetail, CaseSummary, GraphResponse, KeyPlayer } from '@/api/types'
import { caseUrl, mapUrl, networkUrl, routeUrl, timelineUrl } from './graph'

export interface GuideTask { title: string; blurb: string; to: string | null }
export interface GuideData { alerts?: Alert[]; players?: KeyPlayer[]; cases?: CaseSummary[]; firstCase?: CaseDetail; graph?: GraphResponse }

function routeFromComplaint({ players = [], firstCase, graph }: GuideData) {
  if (!firstCase || !players.length) return null
  const phone = firstCase.entities.filter(e => e.type === 'phone').sort((a, b) => a.start - b.start)[0]
  if (!phone) return null
  const community = graph?.nodes.find(n => n.id === firstCase.id)?.metrics.community
  const leader = players.find(p => p.community === community) ?? players[0]
  return routeUrl(phone.id, leader.entity_id)
}

export function guideTasks(data: GuideData): GuideTask[] {
  const bridge = data.alerts?.find(a => a.type === 'bridge_node')
  const structuring = data.alerts?.find(a => a.type === 'structuring')
  const firstCase = data.cases?.[0]
  return [
    { title: 'See who connects the groups', blurb: 'The person every route between the groups runs through, and why.', to: bridge ? networkUrl(bridge.entity_ids) : null },
    { title: "Trace a complainant's phone to a leader", blurb: 'Follow the calls from a complaint up to the top of a group.', to: routeFromComplaint(data) },
    { title: 'Follow the money', blurb: 'Transfers split into small amounts to stay under the reporting limit.', to: structuring ? '/alerts?type=structuring' : null },
    { title: 'See when they talked', blurb: 'Calls, transfers and incidents on one timeline.', to: bridge ? timelineUrl(bridge.entity_ids[0]) : null },
    { title: 'See where it happened', blurb: 'FIR places, homes and call activity on a map of Pune.', to: mapUrl() },
    { title: 'Read an FIR', blurb: 'The original complaint with every extracted entity marked.', to: firstCase ? caseUrl(firstCase.id) : null },
    { title: 'Add a new FIR', blurb: 'Upload a complaint and watch the picture change.', to: '/ingest' },
  ]
}
