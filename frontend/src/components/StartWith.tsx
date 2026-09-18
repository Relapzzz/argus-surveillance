import { Link } from 'react-router'
import type { GuideTask } from '@/lib/guide'

export default function StartWith({ tasks }: { tasks: GuideTask[] }) {
  const ready = tasks.filter(task => task.to)
  if (!ready.length) return <p className="empty">Add records and the first moves appear here.</p>
  return <div className="start-rows">{ready.map(task => <Link key={task.title} to={task.to!}>
    <b>{task.title}</b><span>{task.blurb}</span>
  </Link>)}</div>
}
