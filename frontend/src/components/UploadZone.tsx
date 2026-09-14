import { useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import type { IngestKind } from '@/api/types'
import { validateUpload } from '@/lib/ingest'
import { Button } from './ui/button'

export default function UploadZone({ kind, title, description, columns, disabled, onUpload }: { kind: IngestKind; title: string; description: string; columns?: string; disabled: boolean; onUpload: (kind: IngestKind, file: File) => void }) {
  const [file, setFile] = useState<File>()
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const extension = kind === 'fir' ? '.txt' : '.csv'
  const choose = (files: FileList | null) => {
    setError(''); setFile(undefined)
    if (!files?.length) return
    if (files.length !== 1) { setError('Choose one file at a time.'); return }
    const invalid = validateUpload(kind, files[0])
    if (invalid) { setError(invalid); return }
    setFile(files[0])
  }
  return <section className="upload-card panel" aria-label={title}><div className="panel-head"><div><h2>{title}</h2><p>{description}</p></div><FileText size={18} /></div>
    <div className={'drop ' + (dragging ? 'dragging' : '')} onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!disabled) choose(e.dataTransfer.files) }}>
      <Upload size={22} /><strong>Drop a {extension} file here</strong><span>or pick one from this device, up to 2 MB</span><label className="file-picker">Choose file<input type="file" aria-label={`${title} file`} accept={extension} disabled={disabled} onChange={e => { choose(e.target.files); e.target.value = '' }} /></label>
    </div>
    <div className="upload-body">{file && <div className="chosen"><span>{file.name}<small>{(file.size / 1024).toFixed(1)} KB</small></span><Button variant="ghost" size="icon-sm" aria-label={`Remove ${title} file`} disabled={disabled} onClick={() => setFile(undefined)}><X /></Button></div>}{error && <p role="alert" className="upload-error">{error}</p>}{columns && <details className="csv-format"><summary>Required columns</summary><code>{columns}</code></details>}<Button className="upload-submit" disabled={disabled || !file} onClick={() => { if (file) onUpload(kind, file) }}>Add {title}</Button></div>
  </section>
}
