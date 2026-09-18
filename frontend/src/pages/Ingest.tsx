import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, FolderPlus, RotateCcw } from 'lucide-react'
import { api, useFixture } from '@/api/client'
import type { IngestKind } from '@/api/types'
import { uploadWithGraphDiff } from '@/lib/ingest'
import { networkUrl, palette, typeNames } from '@/lib/graph'
import { PageTitle } from '@/components/PageTitle'
import { QueryState } from '@/components/QueryState'
import UploadZone from '@/components/UploadZone'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

type Action = 'clear' | 'reset'
const dialogs: Record<Action, { title: string; body: string; confirm: string }> = {
  clear: { title: 'Start a new investigation?', body: 'Every record in the workspace is removed so the next case starts from its own FIRs, call records and transactions. The demo dataset stays on disk and can be restored later.', confirm: 'Clear the workspace' },
  reset: { title: 'Restore the demo dataset?', body: 'Records added in this session are removed and the seeded Pune network with its 40 FIRs is loaded again.', confirm: 'Restore demo dataset' },
}

export default function Ingest() {
  const cache = useQueryClient()
  const [confirm, setConfirm] = useState<Action>()
  const upload = useMutation({ mutationFn: ({ kind, file }: { kind: IngestKind; file: File }) => uploadWithGraphDiff(kind, file), onSuccess: () => cache.invalidateQueries() })
  const finish = async () => { upload.reset(); setConfirm(undefined); await cache.invalidateQueries() }
  const clear = useMutation({ mutationFn: api.clear, onSuccess: finish })
  const reset = useMutation({ mutationFn: api.reset, onSuccess: finish })
  const busy = upload.isPending || reset.isPending || clear.isPending
  const start = (kind: IngestKind, file: File) => { reset.reset(); clear.reset(); upload.mutate({ kind, file }) }
  const ask = (action: Action) => { reset.reset(); clear.reset(); setConfirm(action) }
  const pending = confirm === 'clear' ? clear : reset
  const added = upload.data?.added ?? []
  return <div className="page">
    <PageTitle title="Add records" hi="रिकॉर्ड जोड़ें" description="Feed an FIR, a call detail record or a bank statement into the network." />
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
    <section className="workspace-actions" aria-label="Workspace">
      <div className="reset"><div><h2>Start a new investigation</h2><p>Empties the workspace so the next case begins from its own FIRs, call records and transactions.</p></div><Button variant="outline" disabled={busy || useFixture} onClick={() => ask('clear')}><FolderPlus data-icon="inline-start" />New investigation</Button></div>
      <div className="reset"><div><h2>Restore the demo dataset</h2><p>Brings back the seeded Pune network with its 40 FIRs, for demos and training.</p></div><Button variant="outline" disabled={busy || useFixture} onClick={() => ask('reset')}><RotateCcw data-icon="inline-start" />Restore demo dataset</Button></div>
    </section>
    {clear.data && <p role="status" className="reset-success">Workspace cleared. Add the first record above.</p>}
    {reset.data && <p role="status" className="reset-success">Demo dataset restored: {reset.data.nodes} entities and {reset.data.edges.toLocaleString('en-IN')} relationships.</p>}
    <Dialog open={Boolean(confirm)} onOpenChange={value => { if (!value && !pending.isPending) setConfirm(undefined) }}><DialogContent showCloseButton={!pending.isPending}>{confirm && <>
      <DialogHeader><DialogTitle>{dialogs[confirm].title}</DialogTitle><DialogDescription>{dialogs[confirm].body}</DialogDescription></DialogHeader><QueryState error={pending.error} />
      <DialogFooter><Button variant="outline" disabled={pending.isPending} onClick={() => setConfirm(undefined)}>Cancel</Button><Button variant="destructive" disabled={pending.isPending} onClick={() => pending.mutate()}>{pending.isPending ? 'Working…' : dialogs[confirm].confirm}</Button></DialogFooter>
    </>}</DialogContent></Dialog>
  </div>
}
