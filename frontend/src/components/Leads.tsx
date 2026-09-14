import { Link } from 'react-router'
import { ArrowUpRight, Banknote, Link2, MoonStar, PhoneCall } from 'lucide-react'
import type { Alert } from '@/api/types'
import { humanize, networkUrl } from '@/lib/graph'

const leads: { type: Alert['type']; icon: typeof Link2; question: string; rule: string }[] = [
  { type: 'bridge_node', icon: Link2, question: 'Who connects the groups?', rule: 'A person with few contacts who sits on most routes between two groups is a likely go-between.' },
  { type: 'structuring', icon: Banknote, question: 'Where is money being split to stay under the limit?', rule: 'Repeated transfers just under a reporting threshold into one account within a week point to layering.' },
  { type: 'burst_calls', icon: PhoneCall, question: 'Which phones lit up together?', rule: 'Many calls between two numbers inside one hour usually mark a coordinated event.' },
  { type: 'night_calls', icon: MoonStar, question: 'Which phones only work at night?', rule: 'Numbers active mostly between midnight and 4 am behave like burner phones.' },
]
export default function Leads({ alerts }: { alerts: Alert[] }) {
  const present = leads.filter(lead => alerts.some(a => a.type === lead.type))
  if (!present.length) return <p className="empty">No patterns flagged yet. Add call or transaction records to look for more.</p>
  return <div className="leads">{present.map(({ type, icon: Icon, question, rule }) => <section className="lead" key={type}><div className="lead-icon"><Icon size={15} /></div><div><h3>{question}</h3><p>{rule}</p>
    {alerts.filter(a => a.type === type).map(a => <Link key={a.id} to={networkUrl(a.entity_ids)}><span className={`sev ${a.severity}`}>{a.severity}</span><span>{humanize(a.title)}</span><ArrowUpRight size={14} /></Link>)}
  </div></section>)}</div>
}
