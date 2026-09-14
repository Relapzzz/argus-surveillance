import { ApiError } from './errors'
import type { Alert, CaseDetail, CaseSummary, Community, EntityDetail, GraphFilters, GraphResponse, IngestKind, IngestResult, KeyPlayer, PathResponse, ResetResult, Stats } from './types'

export { ApiError } from './errors'
export const useFixture = import.meta.env.VITE_USE_FIXTURE === 'true'
export const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '').replace(/\/api$/, '') + '/api'
const fixtureModule = () => import('./fixture').then(m => m.fixture)

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try { response = await fetch(apiBase + path, init) }
  catch { throw new ApiError(0, 'Cannot reach the API. Check the backend and VITE_API_URL, or enable fixture mode for offline viewing.') }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = typeof body?.detail === 'string' ? body.detail : ''
    const message = response.status === 501 ? 'This operation is unavailable in the backend stub. Phase A5 must implement it.' : response.status === 401 ? 'API key rejected. Check VITE_API_KEY and restart the frontend.' : detail || `Request failed (${response.status}).`
    throw new ApiError(response.status, message)
  }
  return response.json() as Promise<T>
}
function mutation<T>(path: string, body?: BodyInit, json = false) {
  if (useFixture) return Promise.reject(new ApiError(501, 'Fixture mode is read-only. Connect to the Phase A5 backend to upload or reset.'))
  const headers: Record<string, string> = { 'X-API-Key': import.meta.env.VITE_API_KEY || '' }
  if (json) headers['Content-Type'] = 'application/json'
  return request<T>(path, { method: 'POST', headers, body })
}
export const api = {
  stats: (): Promise<Stats> => useFixture ? fixtureModule().then(f => f.stats()) : request('/stats'),
  graph: (filters: GraphFilters = {}): Promise<GraphResponse> => {
    if (useFixture) return fixtureModule().then(f => f.graph(filters))
    const params = new URLSearchParams()
    if (filters.types?.length) params.set('types', filters.types.join(','))
    if (filters.community !== undefined) params.set('community', String(filters.community))
    if (filters.min_degree !== undefined) params.set('min_degree', String(filters.min_degree))
    return request('/graph?' + params)
  },
  entity: (id: string): Promise<EntityDetail> => useFixture ? fixtureModule().then(f => f.entity(id)) : request(`/entities/${encodeURIComponent(id)}`),
  ego: (id: string, depth = 1): Promise<GraphResponse> => useFixture ? fixtureModule().then(f => f.ego(id, depth)) : request(`/entities/${encodeURIComponent(id)}/ego?depth=${depth}`),
  keyPlayers: (limit = 10): Promise<KeyPlayer[]> => useFixture ? fixtureModule().then(f => f.keyPlayers(limit)) : request(`/analytics/key-players?limit=${limit}`),
  communities: (): Promise<Community[]> => useFixture ? fixtureModule().then(f => f.communities()) : request('/analytics/communities'),
  alerts: (): Promise<Alert[]> => useFixture ? fixtureModule().then(f => f.alerts()) : request('/analytics/alerts'),
  path: (source: string, target: string): Promise<PathResponse> => useFixture ? fixtureModule().then(f => f.path(source, target)) : request('/analytics/path?' + new URLSearchParams({ source, target })),
  cases: (): Promise<CaseSummary[]> => useFixture ? fixtureModule().then(f => f.cases()) : request('/cases'),
  case: (id: string): Promise<CaseDetail> => useFixture ? fixtureModule().then(f => f.case(id)) : request(`/cases/${encodeURIComponent(id)}`),
  ingest: (kind: IngestKind, file: File): Promise<IngestResult> => {
    const body = new FormData(); body.append('file', file)
    return mutation(`/ingest/${kind}`, body)
  },
  ingestText: (text: string): Promise<IngestResult> => mutation('/ingest/fir', JSON.stringify({ text }), true),
  reset: (): Promise<ResetResult> => mutation('/admin/reset'),
}
