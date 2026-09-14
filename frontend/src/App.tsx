import { NavLink, Route, Routes, Link } from 'react-router'
import { lazy, Suspense } from 'react'
import { LayoutDashboard, Network as NetworkIcon, Files, Upload, ScanEye, ArrowUpRight } from 'lucide-react'
import { useFixture } from './api/client'
import Dashboard from './pages/Dashboard'
const Network = lazy(() => import('./pages/Network'))
import Cases from './pages/Cases'
import Ingest from './pages/Ingest'

const routes = [{ to: '/', label: 'Overview', icon: LayoutDashboard }, { to: '/network', label: 'Network', icon: NetworkIcon }, { to: '/cases', label: 'Cases', icon: Files }, { to: '/ingest', label: 'Ingest', icon: Upload }]
export default function App() {
  return <div className="app-shell">
    <a href="#main" className="skip-link">Skip to content</a>
    <aside className="sidebar">
      <Link to="/" className="brand"><ScanEye size={28} /><span>ARGUS<small>NETWORK INTELLIGENCE</small></span></Link>
      <p className="eyebrow nav-label">WORKSPACE</p>
      <nav aria-label="Main navigation">{routes.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={18} /><span>{label}</span><ArrowUpRight className="nav-arrow" size={14} /></NavLink>)}</nav>
      <div className="sidebar-bottom"><span className="status-dot" />Synthetic dataset<p>Pune · Investigation workspace</p><small>SIH 2026 / NCRB</small></div>
    </aside>
    <div className="workspace"><header className="topbar"><span>Criminal network analysis <span className="muted">/ Workspace</span></span><span className="mode-badge">{useFixture ? 'Fixture mode · read only' : 'Backend API'}</span></header>
      <main id="main"><Suspense fallback={<p role="status" className="loading">Loading workspace…</p>}><Routes><Route path="/" element={<Dashboard />} /><Route path="/network" element={<Network />} /><Route path="/cases" element={<Cases />} /><Route path="/ingest" element={<Ingest />} /><Route path="*" element={<div className="empty"><h1>Page not found</h1><Link to="/">Return to overview</Link></div>} /></Routes></Suspense></main>
    </div>
  </div>
}
