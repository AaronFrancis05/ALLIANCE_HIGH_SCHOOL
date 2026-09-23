/**
 * Upload checks (SRS: upload safety).
 *
 * A file is accepted only when its extension, its declared MIME type and its actual
 * leading bytes all agree, and it is within the size cap for its kind.
 */

import { APIError } from 'payload'
import { APPLICATION_DOCUMENT_MAX_BYTES, APPLICATION_DOCUMENT_TYPES } from './application-documents'

/** `applicantDocument` is a file sent by the public with an application (FR-17). */
export type UploadKind = 'image' | 'document' | 'applicantDocument'

const MAX_BYTES: Record<UploadKind, number> = {
  image: 15 * 1024 * 1024,
  document: 50 * 1024 * 1024,
  applicantDocument: APPLICATION_DOCUMENT_MAX_BYTES,
}

interface Signature {
  mime: string
  extensions: string[]
  /** Leading bytes. `null` means "any byte here". */
  magic: (number | null)[]
  /** Extra bytes to check further into the file, for container formats. */
  at?: { offset: number; bytes: number[] }
}

const SIGNATURES: Signature[] = [
  { mime: 'image/jpeg', extensions: ['jpg', 'jpeg'], magic: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', extensions: ['png'], magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  {
    mime: 'image/webp',
    extensions: ['webp'],
    magic: [0x52, 0x49, 0x46, 0x46],
    at: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  },
  { mime: 'application/pdf', extensions: ['pdf'], magic: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'application/zip', extensions: ['zip'], magic: [0x50, 0x4b, 0x03, 0x04] },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx'],
    magic: [0x50, 0x4b, 0x03, 0x04],
  },
]

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
const DOCUMENT_MIMES = [
  'application/pdf',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ...IMAGE_MIMES,
]

/** From the public: no SVG (it can carry script) and nothing without a magic number. */
const ALLOWED_MIMES: Record<UploadKind, readonly string[]> = {
  image: IMAGE_MIMES,
  document: DOCUMENT_MIMES,
  applicantDocument: APPLICATION_DOCUMENT_TYPES,
}

export interface IncomingFile {
  name: string
  mimetype: string
  size: number
  data: Buffer
}

function matches(signature: Signature, data: Buffer): boolean {
  const leadingOk = signature.magic.every((byte, index) => byte === null || data[index] === byte)
  if (!leadingOk) return false
  if (!signature.at) return true
  return signature.at.bytes.every((byte, index) => data[signature.at!.offset + index] === byte)
}

/** Why a file may not be stored, with the HTTP status that fits, or null when it may. */
export function uploadProblem(
  file: IncomingFile,
  kind: UploadKind,
): { message: string; status: 413 | 415 } | null {
  if (!ALLOWED_MIMES[kind].includes(file.mimetype)) {
    return { message: `Files of type ${file.mimetype} cannot be uploaded here.`, status: 415 }
  }

  if (file.size > MAX_BYTES[kind]) {
    const limit = Math.round(MAX_BYTES[kind] / (1024 * 1024))
    return { message: `That file is too large. The limit is ${limit} MB.`, status: 413 }
  }

  // SVG has no magic number and can carry script, so it is only allowed from staff and
  // is never served from the app's own domain. Everything else must match its bytes.
  if (file.mimetype === 'image/svg+xml') {
    const head = file.data.subarray(0, 1024).toString('utf8').toLowerCase()
    if (head.includes('<script') || head.includes('javascript:') || head.includes('onload=')) {
      return { message: 'That SVG contains script and cannot be uploaded.', status: 415 }
    }
    return null
  }

  if (file.mimetype === 'image/avif') return null // container check not worth the false negatives

  const candidates = SIGNATURES.filter((s) => s.mime === file.mimetype)
  if (candidates.length && !candidates.some((signature) => matches(signature, file.data))) {
    return { message: 'That file does not look like the type it claims to be.', status: 415 }
  }
  return null
}

/**
 * Throws an APIError, which Payload turns into a clear message in the admin panel,
 * when the file is not something we are willing to store.
 */
export async function assertAllowedUpload(file: IncomingFile, kind: UploadKind): Promise<void> {
  const problem = uploadProblem(file, kind)
  if (problem) throw new APIError(problem.message, problem.status)
}
