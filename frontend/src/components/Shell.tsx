import { useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import { api, useFixture } from '@/api/client'
import { caseUrl, profileUrl } from '@/lib/graph'
import { hi, nav } from '@/lib/vocab'
import { Bi } from './Bi'
import Guide from './Guide'
import Search, { caseItems, nodeItems } from './Search'

export const Pin = () => <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M14.5 17.5 9 29" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /><circle cx="19" cy="11.5" r="8.5" fill="var(--string)" /><circle cx="16.2" cy="8.6" r="2.3" fill="var(--string-wash)" opacity=".85" /></svg>

export default function Shell({ children }: { children: ReactNode }) {
  const [armed, setArmed] = useState(false)
  const [guide, setGuide] = useState(false)
  const navigate = useNavigate()
  const graph = useQuery({ queryKey: ['graph'], queryFn: () => api.graph(), enabled: armed })
  const cases = useQuery({ queryKey: ['cases'], queryFn: api.cases, enabled: armed })
  const items = useMemo(() => [...nodeItems(graph.data?.nodes ?? []), ...caseItems(cases.data ?? [])], [graph.data, cases.data])
  return <div className="shell">
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="topbar">
      <Link to="/" className="brand" aria-label="Argus, overview"><Pin /><span className="wordmark">ARGUS</span></Link>
      <nav aria-label="Main navigation" className="tabs">{nav.map(n => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => isActive ? 'tab active' : 'tab'}><Bi en={n.en} hi={n.hi} /></NavLink>)}</nav>
      <Search items={items} label="Find a record" placeholder="Find a name, phone, plate, account or FIR number" onFocus={() => setArmed(true)} onPick={i => navigate(i.type === 'case' ? caseUrl(i.id) : profileUrl(i.id))} />
      <button type="button" className="guide-button" onClick={() => setGuide(true)}><BookOpen size={18} aria-hidden="true" /><Bi en="Guide" hi={hi.guide} /></button>
    </header>
    <main id="main">{children}</main>
    <footer className="status-line"><span><i className={useFixture ? 'dot demo' : 'dot'} />{useFixture ? 'Demo records, read only' : 'Live records'}</span><span>Synthetic data built for Smart India Hackathon 2026</span></footer>
    <Guide open={guide} onOpenChange={setGuide} />
  </div>
}
