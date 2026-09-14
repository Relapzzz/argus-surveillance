import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { api } from '@/api/client'
import { PageHeading } from '@/components/PageHeading'
import { QueryState } from '@/components/QueryState'
import Narrative from '@/components/Narrative'
import { networkUrl, palette, typeNames } from '@/lib/graph'

export default function Cases() {
  const [params, setParams] = useSearchParams()
  const selected = params.get('case')
  const [search, setSearch] = useState('')
  const cases = useQuery({ queryKey: ['cases'], queryFn: api.cases })
  const detail = useQuery({ queryKey: ['case', selected], queryFn: () => api.case(selected!), enabled: Boolean(selected) })
  const matches = cases.data?.filter(c => `${c.fir_number} ${c.station}`.toLowerCase().includes(search.toLowerCase()))
  const unique = detail.data ? [...new Map(detail.data.entities.map(s => [s.id, s])).values()] : []
  return <div className="page">
    <PageHeading title="Case files" description="The original FIR behind every link. Highlighted text is an extracted entity." />
    <QueryState pending={cases.isPending} error={cases.error} retry={() => cases.refetch()} />
    <div className="cases">
      <section className="panel" aria-label="Case list"><div className="panel-head"><h2>FIRs</h2><span className="count">{cases.data?.length ?? '—'}</span></div>
        <div className="case-search search"><Search size={14} /><input aria-label="Search cases" placeholder="FIR number or station" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {matches?.map(c => <button className="case-row" aria-current={selected === c.id} key={c.id} onClick={() => setParams({ case: c.id })}><b>{c.fir_number}</b><span>{c.station}</span><small>{c.incident_time?.slice(0, 10) ?? 'Date not recorded'} · {c.entity_count} entities</small></button>)}
        {matches?.length === 0 && <p className="empty">No FIR matches.</p>}
      </section>
      <section className="panel" aria-label="Case file">{!selected ? <div className="empty"><h2>Pick an FIR</h2><p>Its narrative, the entities extracted from it and their place in the network appear here.</p></div> : <>
        <QueryState pending={detail.isPending} error={detail.error} retry={() => detail.refetch()} />
        {detail.data && <>
          <div className="case-head"><p>First information report</p><h2 className="display">{detail.data.fir_number}</h2><span>{detail.data.station} police station</span></div>
          <div className="case-meta"><span>Incident {detail.data.incident_time?.replace('T', ' ') ?? 'not recorded'}</span><span>{detail.data.entity_count} entities extracted</span></div>
          <div className="sections">{detail.data.sections.map(section => <span key={section}>{section}</span>)}</div>
          <p className="sheet-note">Click a highlighted entity to open it on the network.</p>
          <Narrative detail={detail.data} />
          <div className="chips">{unique.map(span => <Link key={span.id} to={networkUrl([span.id])}><i style={{ background: palette[span.type] }} />{span.label}<small>{typeNames[span.type]}</small></Link>)}</div>
          {!unique.length && <p className="empty">No entities were extracted from this FIR.</p>}
        </>}
      </>}</section>
    </div>
  </div>
}
