import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon } from 'lucide-react'
import { api } from '@/api/client'
import type { CaseSummary } from '@/api/types'
import { PageTitle } from '@/components/PageTitle'
import { QueryState } from '@/components/QueryState'
import Narrative from '@/components/Narrative'
import { formatCount, formatDate, formatDateTime, formatLabel, plural } from '@/lib/format'
import { palette, profileUrl, typeNames } from '@/lib/graph'
import './cases.css'

const when = (c: CaseSummary) => c.incident_time ? formatDate(c.incident_time) : 'date not recorded'

export default function Cases() {
  const [params, setParams] = useSearchParams()
  const selected = params.get('case')
  const [search, setSearch] = useState('')
  const cases = useQuery({ queryKey: ['cases'], queryFn: api.cases })
  const graph = useQuery({ queryKey: ['graph'], queryFn: () => api.graph() })
  const detail = useQuery({ queryKey: ['case', selected], queryFn: () => api.case(selected!), enabled: Boolean(selected) })
  const accused = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of graph.data?.edges ?? []) {
      if (e.type !== 'mentioned_in' || e.attributes.role !== 'accused') continue
      const caseId = e.target.startsWith('case:') ? e.target : e.source
      counts.set(caseId, (counts.get(caseId) ?? 0) + 1)
    }
    return counts
  }, [graph.data])
  const matches = cases.data?.filter(c => `${c.fir_number} ${c.station}`.toLowerCase().includes(search.toLowerCase()))
  const unique = detail.data ? [...new Map(detail.data.entities.map(s => [s.id, s])).values()] : []
  return <div className="page">
    <PageTitle title="Case files" hi="केस फ़ाइलें" description="The original FIR behind every link. Highlighted text is what the system read out of it." />
    <QueryState pending={cases.isPending} error={cases.error} retry={() => cases.refetch()} />
    <div className="cases">
      <section className="register" aria-label="FIR register">
        <div className="register-head"><h2>FIR register</h2>{cases.data && <span className="count">{formatCount(cases.data.length)}</span>}</div>
        <div className="search"><SearchIcon size={16} aria-hidden="true" /><input aria-label="Search cases" placeholder="FIR number or police station" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {matches?.map(c => <button className="case-row" aria-current={selected === c.id} key={c.id} onClick={() => setParams({ case: c.id })}>
          <b className="tabular">{c.fir_number}</b>
          <span>{c.station}, {when(c)}</span>
          <div className="sections">{c.sections.slice(0, 3).map(section => <span key={section}>{section}</span>)}{c.sections.length > 3 && <span>and {c.sections.length - 3} more</span>}</div>
          <span>{plural(accused.get(c.id) ?? 0, 'accused', 'accused')}, {plural(c.entity_count, 'entity', 'entities')} named</span>
        </button>)}
        {cases.data?.length === 0 ? <p className="empty">No FIRs yet. Add one on the Add records page.</p> : matches?.length === 0 && <p className="empty">No FIR matches.</p>}
      </section>
      <section className="file" aria-label="Case file">{!selected ? <div className="empty"><h2>Pick an FIR from the register</h2><p>The complaint appears here as it was written, with every person, phone, place and vehicle the system found marked in the text.</p></div> : <>
        <QueryState pending={detail.isPending} error={detail.error} retry={() => detail.refetch()} />
        {detail.data && <>
          <article className="sheet">
            <div className="sheet-title"><p className="kicker">First information report</p><h2 className="display tabular">{detail.data.fir_number}</h2></div>
            <dl className="sheet-head">
              <div><dt>FIR No.</dt><dd className="tabular">{detail.data.fir_number.replace('FIR-', '')}</dd></div>
              <div><dt>Police station</dt><dd>{detail.data.station || 'not recorded'}</dd></div>
              <div><dt>Date and time of incident</dt><dd>{detail.data.incident_time ? formatDateTime(detail.data.incident_time) : 'not recorded'}</dd></div>
              <div><dt>Sections</dt><dd>{detail.data.sections.length ? detail.data.sections.join(', ') : 'none recorded'}</dd></div>
            </dl>
            <Narrative detail={detail.data} />
          </article>
          <section className="named section">
            <div className="section-head"><h2>Named in this FIR</h2><p>Open anyone to see their full profile.</p></div>
            {unique.length ? <div className="chips">{unique.map(span => <Link key={span.id} to={profileUrl(span.id)}><i style={{ background: palette[span.type] }} /><span className="tabular">{formatLabel(span.type, span.label)}</span><small>{typeNames[span.type]}</small></Link>)}</div> : <p className="empty">No entities were extracted from this FIR.</p>}
          </section>
        </>}
      </>}</section>
    </div>
  </div>
}
