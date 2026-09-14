import { api } from '@/api/client'
import type { GraphNode, IngestKind, IngestResult } from '@/api/types'

export const maxUploadBytes = 2 * 1024 * 1024
export function validateUpload(kind: IngestKind, file: File) {
  const extension = kind === 'fir' ? '.txt' : '.csv'
  if (!file.name.toLowerCase().endsWith(extension)) return `Choose a ${extension} file for this source.`
  if (!file.size) return 'The file is empty.'
  if (file.size > maxUploadBytes) return 'The file exceeds the 2 MB limit.'
  return null
}
export interface UploadOutcome { result: IngestResult; added: GraphNode[]; refreshWarning?: string }
export async function uploadWithGraphDiff(kind: IngestKind, file: File): Promise<UploadOutcome> {
  const invalid = validateUpload(kind, file)
  if (invalid) throw new Error(invalid)
  const before = new Set((await api.graph()).nodes.map(n => n.id))
  const result = await api.ingest(kind, file)
  try {
    const after = await api.graph()
    return { result, added: after.nodes.filter(n => !before.has(n.id)) }
  } catch {
    return { result, added: [], refreshWarning: 'The upload succeeded, but the network could not be refreshed. Open the network to load it again. Do not upload the same file twice.' }
  }
}
