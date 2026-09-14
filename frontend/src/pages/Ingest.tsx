import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import { api, useFixture } from '@/api/client'
import type { IngestKind } from '@/api/types'
import { uploadWithGraphDiff } from '@/lib/ingest'
import { networkUrl } from '@/lib/graph'
import { PageHeading } from '@/components/PageHeading'
import { QueryState } from '@/components/QueryState'
import UploadZone from '@/components/UploadZone'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export default function Ingest() {
  const cache = useQueryClient()
  const [confirmReset, setConfirmReset] = useState(false)
  const upload = useMutation({ mutationFn: ({ kind, file }: { kind: IngestKind; file: File }) => uploadWithGraphDiff(kind, file), onSuccess: () => cache.invalidateQueries() })
  const reset = useMutation({ mutationFn: api.reset, onSuccess: async () => { upload.reset(); setConfirmReset(false); await cache.invalidateQueries() } })
  const busy = upload.isPending || reset.isPending
  return <><PageHeading title="Add source records" description="Bring FIRs, call records, and transactions into the network." />
    <div className="ingest-notice">Use synthetic records only. Uploads are merged into the current network and analytics are recalculated.</div>
    {useFixture && <div className="ingest-notice fixture-notice">Fixture mode is read-only. Upload and reset require the Phase A5 backend with VITE_USE_FIXTURE=false and a matching VITE_API_KEY.</div>}
    <div className="upload-grid"><UploadZone kind="fir" title="FIR" description="Extract entities from a narrative" disabled={busy || useFixture} onUpload={(kind, file) => { reset.reset(); upload.mutate({ kind, file }) }} /><UploadZone kind="cdr" title="CDR" description="Link phone calls and communication" columns="caller, callee, start_time, duration_sec, tower_id, tower_location" disabled={busy || useFixture} onUpload={(kind, file) => { reset.reset(); upload.mutate({ kind, file }) }} /><UploadZone kind="transactions" title="Transactions" description="Connect accounts and money flows" columns="txn_id, from_account, to_account, amount, timestamp, mode" disabled={busy || useFixture} onUpload={(kind, file) => { reset.reset(); upload.mutate({ kind, file }) }} /></div>
    {upload.isPending && <p className="loading" role="status">Processing the source record. Extraction may take a minute. Keep this page open.</p>}<QueryState error={upload.error} />
    {upload.data && <section className="upload-result panel" aria-label="Upload result"><p className="eyebrow">UPLOAD COMPLETE</p><h2>Source record added</h2><div className="result-counts"><span><strong>{upload.data.result.entities_added}</strong> entities added</span><span><strong>{upload.data.result.relationships_added}</strong> relationships added</span></div>{upload.data.result.case_id && <Link className="text-button" to={'/cases?' + new URLSearchParams({ case: upload.data.result.case_id })}>Open source case</Link>}
      {upload.data.refreshWarning ? <p role="status" className="upload-error">{upload.data.refreshWarning}</p> : <p className="muted">{upload.data.newIds.length ? `${upload.data.newIds.length} new entities were observed between the before and after graph snapshots.` : 'No new entity IDs were observed. Existing entities may have gained relationships or evidence.'}</p>}<Link className="primary-link" to={networkUrl(upload.data.newIds)}>View updated network<ArrowUpRight size={16} /></Link></section>}
    <section className="reset-section"><div><h2>Restore the seed network</h2><p>Reset removes uploaded changes and reloads the backend seed.</p></div><Button variant="outline" disabled={busy || useFixture} onClick={() => { reset.reset(); setConfirmReset(true) }}><RotateCcw size={15} />Reset network</Button></section>
    {reset.data && <p role="status" className="reset-success">Seed restored: {reset.data.nodes} nodes and {reset.data.edges} edges.</p>}
    <Dialog open={confirmReset} onOpenChange={value => { if (!reset.isPending) setConfirmReset(value) }}><DialogContent showCloseButton={!reset.isPending}><DialogHeader><DialogTitle>Reset the network?</DialogTitle><DialogDescription>This removes uploaded changes and restores the backend seed. Continue only if you no longer need the current investigation changes.</DialogDescription></DialogHeader><QueryState error={reset.error} /><DialogFooter><Button variant="outline" disabled={reset.isPending} onClick={() => setConfirmReset(false)}>Cancel</Button><Button variant="destructive" disabled={reset.isPending} onClick={() => reset.mutate()}>{reset.isPending ? 'Resetting…' : 'Restore seed'}</Button></DialogFooter></DialogContent></Dialog>
  </>
}
