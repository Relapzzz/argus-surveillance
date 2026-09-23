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

const Logo = () => <svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M28.22 11.55A13 13 0 1 1 20.45 3.78" /><path d="M7.79 18.2A8.5 8.5 0 1 1 13.8 24.21" /></g><g fill="currentColor"><circle cx="28.22" cy="11.55" r="2.1" /><circle cx="20.45" cy="3.78" r="2.1" /><circle cx="7.79" cy="18.2" r="2.1" /><circle cx="13.8" cy="24.21" r="2.1" /></g><circle cx="16" cy="16" r="3.6" fill="var(--string)" /></svg>

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
      <Link to="/" className="brand" aria-label="VYUHA, overview"><Logo /><span className="wordmark"><Bi en="VYUHA" hi={hi.brand} /></span></Link>
      <nav aria-label="Main navigation" className="tabs">{nav.map(n => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => isActive ? 'tab active' : 'tab'}><Bi en={n.en} hi={n.hi} /></NavLink>)}</nav>
      <Search items={items} label="Find a record" placeholder="Find a name, phone, plate, account or FIR number" onFocus={() => setArmed(true)} onPick={i => navigate(i.type === 'case' ? caseUrl(i.id) : profileUrl(i.id))} />
      <button type="button" className="guide-button" onClick={() => setGuide(true)}><BookOpen size={18} aria-hidden="true" /><Bi en="Guide" hi={hi.guide} /></button>
    </header>
    <main id="main">{children}</main>
    <footer className="status-line"><span><i className={useFixture ? 'dot demo' : 'dot'} />{useFixture ? 'Demo records, read only' : 'Live records'}</span><span>Synthetic data built for Smart India Hackathon 2026</span></footer>
    <Guide open={guide} onOpenChange={setGuide} />
  </div>
}
