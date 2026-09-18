import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router'
import Shell from './components/Shell'
import Overview from './pages/Overview'
import Cases from './pages/Cases'
import Ingest from './pages/Ingest'
const Network = lazy(() => import('./pages/Network'))
const Profile = lazy(() => import('./pages/Profile'))
const Timeline = lazy(() => import('./pages/Timeline'))
const MapPage = lazy(() => import('./pages/Map'))
const Alerts = lazy(() => import('./pages/Alerts'))

export default function App() {
  return <Shell>
    <Suspense fallback={<p role="status" className="loading">Loading…</p>}>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/network" element={<Network />} />
        <Route path="/entity/:id" element={<Profile />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/ingest" element={<Ingest />} />
        <Route path="*" element={<div className="page"><div className="empty"><h2>Page not found</h2><Link className="text-button" to="/">Back to the overview</Link></div></div>} />
      </Routes>
    </Suspense>
  </Shell>
}
