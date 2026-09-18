import { describe, expect, it } from 'vitest'
import { maxUploadBytes, validateUpload } from './ingest'

const file = (name: string, size: number) => new File([new Uint8Array(size)], name)

describe('upload validation', () => {
  it('accepts the right extension within the limit', () => {
    expect(validateUpload('fir', file('FIR-2026-0041.txt', 900))).toBeNull()
    expect(validateUpload('cdr', file('calls.CSV', 900))).toBeNull()
  })
  it('rejects the wrong extension, empty files and files over 2 MB', () => {
    expect(validateUpload('fir', file('calls.csv', 900))).toBe('Choose a .txt file for this source.')
    expect(validateUpload('transactions', file('notes.txt', 900))).toBe('Choose a .csv file for this source.')
    expect(validateUpload('fir', file('empty.txt', 0))).toBe('The file is empty.')
    expect(validateUpload('cdr', file('big.csv', maxUploadBytes + 1))).toBe('The file exceeds the 2 MB limit.')
  })
})
