import { NavLink, Route, Routes, Link } from 'react-router'
import { lazy, Suspense } from 'react'
import { ClipboardList, Waypoints, Files, Upload, ScanEye } from 'lucide-react'
import { useFixture } from './api/client'
import Briefing from './pages/Briefing'
const Network = lazy(() => import('./pages/Network'))
import Cases from './pages/Cases'
import Ingest from './pages/Ingest'

const routes = [{ to: '/', label: 'Briefing', icon: ClipboardList }, { to: '/network', label: 'Network', icon: Waypoints }, { to: '/cases', label: 'Case files', icon: Files }, { to: '/ingest', label: 'Add records', icon: Upload }]
export default function App() {
  return <div className="app">
    <a href="#main" className="skip-link">Skip to content</a>
    <aside className="rail">
      <Link to="/" className="brand"><ScanEye size={24} /><span><b>ARGUS</b><small>Criminal network analysis</small></span></Link>
      <nav aria-label="Main navigation">{routes.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={16} /><span>{label}</span></NavLink>)}</nav>
      <div className="rail-foot"><span className={'dot' + (useFixture ? ' warn' : '')} />{useFixture ? 'Fixture data · read only' : 'Live API'}<small>Synthetic data · SIH 2026 · NCRB</small></div>
    </aside>
    <main id="main"><Suspense fallback={<p role="status" className="loading">Loading…</p>}><Routes><Route path="/" element={<Briefing />} /><Route path="/network" element={<Network />} /><Route path="/cases" element={<Cases />} /><Route path="/ingest" element={<Ingest />} /><Route path="*" element={<div className="empty"><h2>Page not found</h2><Link className="text-button" to="/">Back to the briefing</Link></div>} /></Routes></Suspense></main>
  </div>
}
