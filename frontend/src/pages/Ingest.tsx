import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderPlus, RotateCcw } from 'lucide-react'
import { api, useFixture } from '@/api/client'
import type { IngestKind } from '@/api/types'
import { uploadWithGraphDiff } from '@/lib/ingest'
import { formatCount, formatLabel, plural } from '@/lib/format'
import { caseUrl, networkUrl, palette, profileUrl, typeNames } from '@/lib/graph'
import { hi } from '@/lib/vocab'
import { Bi } from '@/components/Bi'
import { PageTitle } from '@/components/PageTitle'
import { QueryState } from '@/components/QueryState'
import UploadZone from '@/components/UploadZone'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import './ingest.css'

type Action = 'clear' | 'reset'
const dialogs: Record<Action, { title: string; body: string; confirm: string }> = {
  clear: { title: 'Start a new investigation?', body: 'Every record in the workspace is removed so the next case starts from its own FIRs, call records and bank transfers. The demo records stay on disk and can be restored later.', confirm: 'Clear the workspace' },
  reset: { title: 'Restore the demo records?', body: 'Records added in this session are removed and the seeded Pune network with its 40 FIRs is loaded again.', confirm: 'Restore the demo records' },
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
    <PageTitle title="Add records" hi="रिकॉर्ड जोड़ें" description="Add an FIR, a call detail record export or a bank statement. Each file adds to the same picture." />
    {useFixture && <div className="notice warn">The demo records are read only. Connect to the records service to add records.</div>}
    <ol className="steps">
      <li><b>1</b><span><strong>Read.</strong> People, phones, vehicles, accounts, places and organisations are picked out of the text or the CSV.</span></li>
      <li><b>2</b><span><strong>Match.</strong> The same phone, plate, account or name in any file becomes one entity, so every record adds to the same picture.</span></li>
      <li><b>3</b><span><strong>Recompute.</strong> Groups, key people, routes and flagged patterns are worked out again at once.</span></li>
    </ol>
    <div className="uploads">
      <UploadZone kind="fir" title="FIR" description="A complaint narrative as a .txt file." disabled={busy || useFixture} onUpload={start} />
      <UploadZone kind="cdr" title="Call records" description="A call detail record export as .csv." columns="caller, callee, start_time, duration_sec, tower_id, tower_location" disabled={busy || useFixture} onUpload={start} />
      <UploadZone kind="transactions" title="Bank transfers" description="Account statements as .csv." columns="txn_id, from_account, to_account, amount, timestamp, mode" disabled={busy || useFixture} onUpload={start} />
    </div>
    {upload.isPending && <p className="loading" role="status">Reading the records. A new FIR can take up to a minute. Keep this page open.</p>}
    <QueryState error={upload.error} />
    {upload.data && <section className="result" aria-label="Upload result">
      <div className="section-head"><h2>Record added</h2>{upload.data.result.case_id && <Link className="text-button" to={'/cases?' + new URLSearchParams({ case: upload.data.result.case_id })}>Open the FIR</Link>}</div>
      <div className="result-nums"><div><strong className="numeral">{formatCount(upload.data.result.entities_added)}</strong><span>{upload.data.result.entities_added === 1 ? 'entity added' : 'entities added'}</span></div><div><strong className="numeral">{formatCount(upload.data.result.relationships_added)}</strong><span>{upload.data.result.relationships_added === 1 ? 'relationship added' : 'relationships added'}</span></div><div><strong className="numeral">{formatCount(added.length)}</strong><span>{added.length === 1 ? 'new entity on the board' : 'new entities on the board'}</span></div></div>
      {added.length > 0 && <div className="chips">{added.map(n => <Link key={n.id} to={n.type === 'case' ? caseUrl(n.id) : profileUrl(n.id)}><i style={{ background: palette[n.type] }} /><span className="tabular">{formatLabel(n.type, n.label)}</span><small>{typeNames[n.type]}</small></Link>)}</div>}
      {upload.data.refreshWarning ? <p role="status" className="result-note">{upload.data.refreshWarning}</p> : !added.length && <p className="result-note">No new entity appeared. Existing entities gained relationships or evidence instead.</p>}
      <div className="actions"><Link className={buttonVariants({ size: 'lg' })} to={networkUrl(added.map(n => n.id))}><Bi en="Show on network" hi={hi.showOnNetwork} /></Link></div>
    </section>}
    <section className="workspace section" aria-label="Workspace">
      <div className="section-head"><h2>Workspace</h2><p>Two ways to start over.</p></div>
      <div className="workspace-row"><div><h3>Start a new investigation</h3><p>Empties the workspace so the next case begins from its own FIRs, call records and bank transfers.</p></div><Button variant="outline" size="lg" disabled={busy || useFixture} onClick={() => ask('clear')}><FolderPlus data-icon="inline-start" /><Bi en="New investigation" hi={hi.newInvestigation} /></Button></div>
      <div className="workspace-row"><div><h3>Restore the demo records</h3><p>Brings back the seeded Pune network with its 40 FIRs, for demonstrations and training.</p></div><Button variant="outline" size="lg" disabled={busy || useFixture} onClick={() => ask('reset')}><RotateCcw data-icon="inline-start" /><Bi en="Restore demo records" hi={hi.restoreDemo} /></Button></div>
      {clear.data && <p role="status" className="workspace-note">Workspace cleared. Add the first record above.</p>}
      {reset.data && <p role="status" className="workspace-note">Demo records restored: {plural(reset.data.nodes, 'entity', 'entities')} and {plural(reset.data.edges, 'relationship')}.</p>}
    </section>
    <Dialog open={Boolean(confirm)} onOpenChange={value => { if (!value && !pending.isPending) setConfirm(undefined) }}><DialogContent showCloseButton={!pending.isPending}>{confirm && <>
      <DialogHeader><DialogTitle>{dialogs[confirm].title}</DialogTitle><DialogDescription>{dialogs[confirm].body}</DialogDescription></DialogHeader><QueryState error={pending.error} />
      <DialogFooter><Button variant="outline" disabled={pending.isPending} onClick={() => setConfirm(undefined)}>Cancel</Button><Button variant="destructive" disabled={pending.isPending} onClick={() => pending.mutate()}>{pending.isPending ? 'Working' : dialogs[confirm].confirm}</Button></DialogFooter>
    </>}</DialogContent></Dialog>
  </div>
}
