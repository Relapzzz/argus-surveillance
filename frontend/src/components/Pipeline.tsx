import type { GraphResponse, Stats } from '@/api/types'
import { formatCount } from '@/lib/format'

const total = (graph: GraphResponse | undefined, pick: (edge: GraphResponse['edges'][number]) => boolean) =>
  graph && graph.edges.filter(pick).reduce((sum, edge) => sum + Number(edge.attributes.count ?? 0), 0)

export default function Pipeline({ stats, graph }: { stats?: Stats; graph?: GraphResponse }) {
  const entities = stats && Object.values(stats.entities).reduce((a, b) => a + b, 0)
  const steps = [
    { count: stats?.cases, label: 'FIRs read' },
    { count: total(graph, e => e.type === 'called' && Array.isArray(e.attributes.timestamps)), label: 'call records matched' },
    { count: total(graph, e => e.type === 'transacted'), label: 'transfers followed' },
    { count: entities, label: 'entities resolved' },
    { count: stats?.relationships, label: 'links drawn' },
    { count: stats?.entities.person, label: 'people ranked' },
    { count: stats?.alerts, label: 'patterns flagged' },
  ]
  return <ol className="steps-strip">{steps.map((step, i) => <li key={step.label}>
    <span className="step-n">{i + 1}</span>
    {step.count !== undefined && <b className="numeral">{formatCount(step.count)}</b>}
    <span>{step.label}</span>
  </li>)}</ol>
}
