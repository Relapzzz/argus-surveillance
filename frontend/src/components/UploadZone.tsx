import { useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import type { IngestKind } from '@/api/types'
import { validateUpload } from '@/lib/ingest'
import { Button } from './ui/button'

export default function UploadZone({ kind, title, description, columns, disabled, onUpload }: { kind: IngestKind; title: string; description: string; columns?: string; disabled: boolean; onUpload: (kind: IngestKind, file: File) => void }) {
  const [file, setFile] = useState<File>()
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const choose = (files: FileList | null) => {
    setError(''); setFile(undefined)
    if (!files?.length) return
    if (files.length !== 1) { setError('Select one file at a time.'); return }
    const invalid = validateUpload(kind, files[0])
    if (invalid) { setError(invalid); return }
    setFile(files[0])
  }
  return <section className="upload-card panel" aria-label={title}><div className="section-heading"><div><h2>{title}</h2><p>{description}</p></div><FileText size={19} /></div>
    <div className={'drop-zone ' + (dragging ? 'dragging' : '')} onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!disabled) choose(e.dataTransfer.files) }}>
      <Upload size={24} /><strong>Drop your {kind === 'fir' ? '.txt' : '.csv'} file here</strong><span>or choose a file from your device</span><label className="file-picker">Choose file<input ref={input} type="file" aria-label={`${title} file`} accept={kind === 'fir' ? '.txt' : '.csv'} disabled={disabled} onChange={e => { choose(e.target.files); e.target.value = '' }} /></label><small>One file · Up to 2 MB</small>
    </div>
    <div className="upload-card-body">{file && <div className="chosen-file"><span>{file.name}<small>{(file.size / 1024).toFixed(1)} KB</small></span><Button variant="ghost" size="icon-sm" aria-label={`Remove ${title} file`} disabled={disabled} onClick={() => setFile(undefined)}><X /></Button></div>}{error && <p role="alert" className="upload-error">{error}</p>}{columns && <details className="csv-format"><summary>Required CSV columns</summary><code>{columns}</code></details>}<Button className="upload-submit" disabled={disabled || !file} onClick={() => { if (file) onUpload(kind, file) }}>Upload {title}</Button></div>
  </section>
}
