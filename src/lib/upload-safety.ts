/**
 * Upload checks (SRS: upload safety).
 *
 * A file is accepted only when its name passes the shared Zod schema, its extension, its
 * declared MIME type and its actual leading bytes all agree, it is within the size cap for
 * its kind, and, for ZIP containers (ZIP folders and Word files), its contents pass
 * `zipProblem`.
 */

import { APIError } from 'payload'
import { APPLICATION_DOCUMENT_MAX_BYTES, APPLICATION_DOCUMENT_TYPES } from './application-documents'
import { fileExtension, incomingFileSchema } from './validation'
import { zipProblem } from './zip-inspect'

/**
 * `applicantDocument` is a file sent by the public with an application (FR-17).
 * `holidayWork` is holiday work for a subject: PDF or Word only. `holidayWorkArchive` adds
 * ZIP folders, for subjects whose practicals are handed out as folders (ICT).
 */
export type UploadKind = 'image' | 'document' | 'applicantDocument' | 'holidayWork' | 'holidayWorkArchive'

const PDF = 'application/pdf'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const ZIP = 'application/zip'

const MAX_BYTES: Record<UploadKind, number> = {
  image: 15 * 1024 * 1024,
  document: 50 * 1024 * 1024,
  applicantDocument: APPLICATION_DOCUMENT_MAX_BYTES,
  holidayWork: 50 * 1024 * 1024,
  holidayWorkArchive: 50 * 1024 * 1024,
}

interface Signature {
  mime: string
  extensions: string[]
  /** Leading bytes. `null` means "any byte here"; an empty list means no magic number. */
  magic: (number | null)[]
  /** Extra bytes to check further into the file, for container formats. */
  at?: { offset: number; bytes: number[] }
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

const SIGNATURES: Signature[] = [
  { mime: 'image/jpeg', extensions: ['jpg', 'jpeg'], magic: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', extensions: ['png'], magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  {
    mime: 'image/webp',
    extensions: ['webp'],
    magic: [0x52, 0x49, 0x46, 0x46],
    at: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  },
  { mime: 'image/avif', extensions: ['avif'], magic: [] },
  { mime: 'image/svg+xml', extensions: ['svg'], magic: [] },
  { mime: PDF, extensions: ['pdf'], magic: [0x25, 0x50, 0x44, 0x46] },
  { mime: ZIP, extensions: ['zip'], magic: ZIP_MAGIC },
  { mime: DOCX, extensions: ['docx'], magic: ZIP_MAGIC },
]

/**
 * Other names browsers give the same type. Chrome and Edge on Windows send a ZIP folder as
 * `application/x-zip-compressed`, so without this every ZIP from a school computer would
 * be refused. The bytes are still checked against the real type.
 */
const MIME_ALIASES: Record<string, string> = {
  'application/x-zip-compressed': ZIP,
  'application/x-zip': ZIP,
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
}

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
const DOCUMENT_MIMES = [PDF, DOCX, ...IMAGE_MIMES]

/** From the public: no SVG (it can carry script) and nothing without a magic number. */
const ALLOWED_MIMES: Record<UploadKind, readonly string[]> = {
  image: IMAGE_MIMES,
  document: DOCUMENT_MIMES,
  applicantDocument: APPLICATION_DOCUMENT_TYPES,
  holidayWork: [PDF, DOCX],
  holidayWorkArchive: [PDF, DOCX, ZIP],
}

const KIND_DESCRIPTIONS: Partial<Record<UploadKind, string>> = {
  holidayWork: 'Holiday work must be a PDF or a Word (.docx) file.',
  holidayWorkArchive: 'Holiday work must be a PDF, a Word (.docx) file or a ZIP folder.',
}

export interface IncomingFile {
  name: string
  mimetype: string
  size: number
  data: Buffer
}

export interface UploadProblem {
  message: string
  status: 413 | 415
}

/** The declared MIME type with parameters dropped and browser aliases resolved. */
export function normaliseMimeType(mimetype: string): string {
  const essence = mimetype.split(';')[0].trim().toLowerCase()
  return MIME_ALIASES[essence] ?? essence
}

/** True when a file of this (already stored) type may sit under this kind. */
export function isAllowedType(mimetype: string, kind: UploadKind): boolean {
  return ALLOWED_MIMES[kind].includes(normaliseMimeType(mimetype))
}

function matches(signature: Signature, data: Buffer): boolean {
  const leadingOk = signature.magic.every((byte, index) => byte === null || data[index] === byte)
  if (!leadingOk) return false
  if (!signature.at) return true
  return signature.at.bytes.every((byte, index) => data[signature.at!.offset + index] === byte)
}

function refuseType(kind: UploadKind, mimetype: string): UploadProblem {
  return { message: KIND_DESCRIPTIONS[kind] ?? `Files of type ${mimetype} cannot be uploaded here.`, status: 415 }
}

/** Why a file may not be stored, with the HTTP status that fits, or null when it may. */
export function uploadProblem(file: IncomingFile, kind: UploadKind): UploadProblem | null {
  const shape = incomingFileSchema.safeParse(file)
  if (!shape.success) return { message: shape.error.issues[0].message, status: 415 }

  const mimetype = normaliseMimeType(file.mimetype)
  if (!ALLOWED_MIMES[kind].includes(mimetype)) return refuseType(kind, mimetype)

  if (file.size > MAX_BYTES[kind] || file.data.length > MAX_BYTES[kind]) {
    const limit = Math.round(MAX_BYTES[kind] / (1024 * 1024))
    return { message: `That file is too large. The limit is ${limit} MB.`, status: 413 }
  }

  // The extension must belong to the declared type, so `notes.pdf.exe` sent as a PDF, or
  // a script renamed to `.docx`, never gets as far as the byte check.
  const signature = SIGNATURES.find((candidate) => candidate.mime === mimetype)
  if (!signature || !signature.extensions.includes(fileExtension(file.name))) {
    return { message: 'The file name does not match its type. Check the extension, such as .pdf.', status: 415 }
  }

  // SVG has no magic number and can carry script, so it is only allowed from staff and
  // is never served from the app's own domain. Everything else must match its bytes.
  if (mimetype === 'image/svg+xml') {
    const head = file.data.subarray(0, 1024).toString('utf8').toLowerCase()
    if (head.includes('<script') || head.includes('javascript:') || head.includes('onload=')) {
      return { message: 'That SVG contains script and cannot be uploaded.', status: 415 }
    }
    return null
  }

  if (mimetype === 'image/avif') return null // container check not worth the false negatives

  if (!matches(signature, file.data)) {
    return { message: 'That file does not look like the type it claims to be.', status: 415 }
  }

  if (mimetype === DOCX || mimetype === ZIP) {
    const problem = zipProblem(file.data, mimetype === DOCX ? 'docx' : 'archive')
    if (problem) return { message: problem, status: 415 }
  }

  return null
}

/**
 * Throws an APIError, which Payload turns into a clear message in the admin panel,
 * when the file is not something we are willing to store.
 */
export async function assertAllowedUpload(file: IncomingFile, kind: UploadKind): Promise<void> {
  const problem = uploadProblem(file, kind)
  if (problem) throw new APIError(problem.message, problem.status, undefined, true)
}
