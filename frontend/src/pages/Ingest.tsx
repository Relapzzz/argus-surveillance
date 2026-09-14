import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import { api, useFixture } from '@/api/client'
import type { IngestKind } from '@/api/types'
import { uploadWithGraphDiff } from '@/lib/ingest'
import { networkUrl, palette, typeNames } from '@/lib/graph'
import { PageHeading } from '@/components/PageHeading'
import { QueryState } from '@/components/QueryState'
import UploadZone from '@/components/UploadZone'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export default function Ingest() {
  const cache = useQueryClient()
  const [confirmReset, setConfirmReset] = useState(false)
  const upload = useMutation({ mutationFn: ({ kind, file }: { kind: IngestKind; file: File }) => uploadWithGraphDiff(kind, file), onSuccess: () => cache.invalidateQueries() })
  const reset = useMutation({ mutationFn: api.reset, onSuccess: async () => { upload.reset(); setConfirmReset(false); await cache.invalidateQueries() } })
  const busy = upload.isPending || reset.isPending
  const start = (kind: IngestKind, file: File) => { reset.reset(); upload.mutate({ kind, file }) }
  const added = upload.data?.added ?? []
  return <div className="page">
    <PageHeading title="Add records" description="Feed an FIR, a call detail record or a bank statement into the network." />
    {useFixture && <div className="notice warn">Fixture data is read only. Uploads and reset need the backend with VITE_USE_FIXTURE=false and a matching VITE_API_KEY.</div>}
    <div className="pipeline"><div><b>1 · Extract</b><p>Regex and a language model pull people, phones, vehicles, accounts, places and organizations out of the text or CSV.</p></div><div><b>2 · Resolve</b><p>Every entity gets a deterministic id, so a phone in a CDR and the same phone in an FIR become one node.</p></div><div><b>3 · Recompute</b><p>The graph is merged and influence, bridging, groups and pattern alerts are recalculated at once.</p></div></div>
    <div className="uploads"><UploadZone kind="fir" title="FIR" description="A narrative as a .txt file" disabled={busy || useFixture} onUpload={start} /><UploadZone kind="cdr" title="Call records" description="A CDR export as .csv" columns="caller, callee, start_time, duration_sec, tower_id, tower_location" disabled={busy || useFixture} onUpload={start} /><UploadZone kind="transactions" title="Transactions" description="Bank transfers as .csv" columns="txn_id, from_account, to_account, amount, timestamp, mode" disabled={busy || useFixture} onUpload={start} /></div>
    {upload.isPending && <p className="loading" role="status">Extracting entities. A new FIR can take up to a minute. Keep this page open.</p>}
    <QueryState error={upload.error} />
    {upload.data && <section className="result panel" aria-label="Upload result"><div className="panel-head"><div><h2>Record added</h2><p>The network and its analytics have been recomputed.</p></div>{upload.data.result.case_id && <Link className="text-button" to={'/cases?' + new URLSearchParams({ case: upload.data.result.case_id })}>Open the FIR</Link>}</div>
      <div className="result-nums"><div><strong>{upload.data.result.entities_added}</strong><span>entities added</span></div><div><strong>{upload.data.result.relationships_added}</strong><span>relationships added</span></div><div><strong>{added.length}</strong><span>new nodes on the canvas</span></div></div>
      {added.length > 0 && <div className="chips">{added.map(n => <Link key={n.id} to={networkUrl([n.id])}><i style={{ background: palette[n.type] }} />{n.label}<small>{typeNames[n.type]}</small></Link>)}</div>}
      {upload.data.refreshWarning ? <p role="status" className="result-note">{upload.data.refreshWarning}</p> : !added.length && <p className="result-note">No new entity appeared. Existing entities gained relationships or evidence instead.</p>}
      <div className="result-actions"><Link className={buttonVariants({ size: 'sm' })} to={networkUrl(added.map(n => n.id))}>Show on the network<ArrowUpRight data-icon="inline-end" /></Link></div>
    </section>}
    <section className="reset"><div><h2>Restore the seed network</h2><p>Drops everything uploaded in this session and reloads the committed dataset.</p></div><Button variant="outline" disabled={busy || useFixture} onClick={() => { reset.reset(); setConfirmReset(true) }}><RotateCcw data-icon="inline-start" />Reset network</Button></section>
    {reset.data && <p role="status" className="reset-success">Seed restored: {reset.data.nodes} entities and {reset.data.edges} relationships.</p>}
    <Dialog open={confirmReset} onOpenChange={value => { if (!reset.isPending) setConfirmReset(value) }}><DialogContent showCloseButton={!reset.isPending}><DialogHeader><DialogTitle>Reset the network?</DialogTitle><DialogDescription>Uploaded records are removed and the seed dataset is reloaded. Continue only if the current changes are no longer needed.</DialogDescription></DialogHeader><QueryState error={reset.error} /><DialogFooter><Button variant="outline" disabled={reset.isPending} onClick={() => setConfirmReset(false)}>Cancel</Button><Button variant="destructive" disabled={reset.isPending} onClick={() => reset.mutate()}>{reset.isPending ? 'Resetting…' : 'Restore seed'}</Button></DialogFooter></DialogContent></Dialog>
  </div>
}
