/**
 * Makes a file sent with an application safe to store (FR-17, A08).
 *
 *   - the declared type must be allow-listed and the leading bytes must match it;
 *   - the size is capped;
 *   - a PDF must be complete, so a half-sent or damaged scan is refused with a clear message;
 *   - photos are decoded and re-encoded, which drops EXIF and any other metadata, including
 *     the GPS position a phone camera records; they are also turned upright and scaled
 *     down to a size that is still easy to read;
 *   - the file gets a random name, so nothing about the child is in the storage key.
 *
 * Server only: it uses sharp.
 */

import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { uploadProblem, type IncomingFile } from './upload-safety'

/** Long edge, in pixels, that a document photo is scaled down to. Still legible when printed. */
export const DOCUMENT_IMAGE_MAX_EDGE = 2000

const EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Re-encodes a photo in its own format. sharp writes no metadata unless asked to. */
async function reencodeImage(data: Buffer, mimetype: string): Promise<Buffer> {
  const image = sharp(data, { failOn: 'error' })
    .rotate()
    .resize({
      width: DOCUMENT_IMAGE_MAX_EDGE,
      height: DOCUMENT_IMAGE_MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })

  if (mimetype === 'image/png') return image.png().toBuffer()
  if (mimetype === 'image/webp') return image.webp({ quality: 85 }).toBuffer()
  return image.jpeg({ quality: 85, mozjpeg: true }).toBuffer()
}

/**
 * A complete PDF ends with a cross-reference table and an end-of-file marker. This is the
 * same structural check Payload makes on upload, run here so the family is told which
 * document to send again instead of getting a general failure.
 */
function looksLikeCompletePdf(data: Buffer): boolean {
  const tail = data.subarray(Math.max(0, data.length - 1024)).toString('latin1')
  return tail.includes('%%EOF') && tail.includes('xref')
}

export type PreparedDocument = { file: IncomingFile } | { problem: string }

export async function prepareApplicantDocument(upload: File): Promise<PreparedDocument> {
  const original: IncomingFile = {
    name: upload.name,
    mimetype: upload.type,
    size: upload.size,
    data: Buffer.from(await upload.arrayBuffer()),
  }

  const problem = uploadProblem(original, 'applicantDocument')
  if (problem) return { problem: problem.message }

  if (original.mimetype === 'application/pdf' && !looksLikeCompletePdf(original.data)) {
    return { problem: 'That PDF looks damaged or incomplete. Please save or scan it again.' }
  }

  let data = original.data
  if (original.mimetype.startsWith('image/')) {
    try {
      data = await reencodeImage(original.data, original.mimetype)
    } catch {
      return { problem: 'That photo could not be read. Please take it again or choose another.' }
    }
  }

  return {
    file: {
      name: `${randomUUID()}.${EXTENSIONS[original.mimetype]}`,
      mimetype: original.mimetype,
      size: data.length,
      data,
    },
  }
}
