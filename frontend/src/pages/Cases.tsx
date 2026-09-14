import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { PageHeading } from '@/components/PageHeading'
import { QueryState } from '@/components/QueryState'
import Narrative from '@/components/Narrative'
import { Input } from '@/components/ui/input'
import { palette, networkUrl } from '@/lib/graph'

export default function Cases() {
  const [params, setParams] = useSearchParams()
  const selected = params.get('case')
  const [search, setSearch] = useState('')
  const cases = useQuery({ queryKey: ['cases'], queryFn: api.cases })
  const detail = useQuery({ queryKey: ['case', selected], queryFn: () => api.case(selected!), enabled: Boolean(selected) })
  const matches = cases.data?.filter(c => `${c.fir_number} ${c.station}`.toLowerCase().includes(search.toLowerCase()))
  const unique = detail.data ? [...new Map(detail.data.entities.map(s => [s.id, s])).values()] : []
  return <><PageHeading title="Source cases" description="Read the original narrative behind each connection." />
    <QueryState pending={cases.isPending} error={cases.error} retry={() => cases.refetch()} />
    <div className="cases-layout"><section className="case-list panel"><div className="section-heading"><h2>Case records</h2><span className="count-badge">{cases.data?.length ?? '—'}</span></div><div className="case-search"><Input aria-label="Search cases" placeholder="Search FIR or station…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      {matches?.map(c => <button className={'case-row ' + (selected === c.id ? 'selected' : '')} key={c.id} onClick={() => setParams({ case: c.id })}><strong>{c.fir_number}</strong><span>{c.station}</span><small>{c.incident_time?.slice(0, 10) ?? 'Date not recorded'} <b>·</b> {c.entity_count} entities</small></button>)}{matches?.length === 0 && <p className="empty">No matching cases.</p>}
    </section><section className="case-detail panel">{!selected ? <div className="empty"><h2>Select a source case</h2><p>Review its narrative, extracted entities, and links to the network.</p></div> : <><QueryState pending={detail.isPending} error={detail.error} retry={() => detail.refetch()} />{detail.data && <>
      <div className="section-heading"><div><p className="eyebrow">SOURCE FIR</p><h2>{detail.data.fir_number}</h2><p>{detail.data.station}</p></div></div><div className="case-content"><div className="case-metadata"><span>Incident: {detail.data.incident_time?.replace('T', ' ') ?? 'Not recorded'}</span><span>{detail.data.entity_count} entities</span></div><div className="section-chips">{detail.data.sections.map(section => <span key={section}>{section}</span>)}</div><h3>Original narrative</h3><p className="muted small-text">Select a highlighted entity to inspect its network.</p><Narrative detail={detail.data} /><h3>Entities in this case</h3><div className="entity-chips">{unique.map(span => <Link key={span.id} to={networkUrl([span.id])} style={{ borderColor: palette[span.type] + '55', color: palette[span.type] }}>{span.label}{' '}<small>{span.type}</small></Link>)}</div>{!unique.length && <p className="muted">No entity spans recorded.</p>}</div>
    </>}</>}</section></div>
  </>
}
