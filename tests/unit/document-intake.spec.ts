// @vitest-environment node
/**
 * Files sent with an application (FR-17, A08): the bytes must match the claimed type, the
 * size is capped, photos lose their metadata, and nothing keeps its original name.
 */

import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { DOCUMENT_IMAGE_MAX_EDGE, prepareApplicantDocument } from '../../src/lib/document-intake'
import { readDocuments } from '../../src/lib/application-documents'

/** A phone-style photo carrying EXIF, including a camera make and a GPS-style comment. */
async function photoWithExif(width = 400, height = 300): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: '#b0a080' } })
    .jpeg()
    .withExif({ IFD0: { Make: 'PhoneMaker', ImageDescription: 'Taken at 0.4000N 32.5000E' } })
    .toBuffer()
}

const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\nxref\n0 1\ntrailer << /Root 1 0 R >>\nstartxref\n9\n%%EOF\n',
)

function file(data: Buffer, name: string, type: string): File {
  return new File([new Uint8Array(data)], name, { type })
}

describe('prepareApplicantDocument', () => {
  it('strips EXIF from a photo and gives it a random name', async () => {
    const original = await photoWithExif()
    expect((await sharp(original).metadata()).exif).toBeDefined()

    const result = await prepareApplicantDocument(file(original, 'Nakato birth cert.jpg', 'image/jpeg'))
    if ('problem' in result) throw new Error(result.problem)

    const metadata = await sharp(result.file.data).metadata()
    expect(metadata.exif).toBeUndefined()
    expect(metadata.format).toBe('jpeg')
    expect(result.file.name).toMatch(/^[0-9a-f-]{36}\.jpg$/)
    expect(result.file.name).not.toContain('Nakato')
  })

  it('scales a very large photo down', async () => {
    const original = await photoWithExif(4000, 3000)
    const result = await prepareApplicantDocument(file(original, 'slip.jpg', 'image/jpeg'))
    if ('problem' in result) throw new Error(result.problem)

    const { width, height } = await sharp(result.file.data).metadata()
    expect(Math.max(width ?? 0, height ?? 0)).toBe(DOCUMENT_IMAGE_MAX_EDGE)
  })

  it('keeps a PDF as it is, under a random name', async () => {
    const result = await prepareApplicantDocument(file(PDF, 'slip.pdf', 'application/pdf'))
    if ('problem' in result) throw new Error(result.problem)
    expect(result.file.data.equals(PDF)).toBe(true)
    expect(result.file.name).toMatch(/\.pdf$/)
  })

  it('refuses a PDF that was cut off before the end', async () => {
    const truncated = PDF.subarray(0, 40)
    const result = await prepareApplicantDocument(file(truncated, 'slip.pdf', 'application/pdf'))
    expect(result).toEqual({ problem: 'That PDF looks damaged or incomplete. Please save or scan it again.' })
  })

  it('refuses a file whose bytes do not match the type it claims', async () => {
    const script = Buffer.from('<html><script>alert(1)</script></html>')
    const result = await prepareApplicantDocument(file(script, 'photo.jpg', 'image/jpeg'))
    expect(result).toEqual({ problem: 'That file does not look like the type it claims to be.' })
  })

  it('refuses a type that is not on the list, even with valid bytes', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    const result = await prepareApplicantDocument(file(svg, 'photo.svg', 'image/svg+xml'))
    expect('problem' in result).toBe(true)
  })

  it('refuses a file over 5 MB', async () => {
    const big = Buffer.concat([PDF, Buffer.alloc(5 * 1024 * 1024)])
    const result = await prepareApplicantDocument(file(big, 'slip.pdf', 'application/pdf'))
    expect(result).toEqual({ problem: 'That file is too large. The limit is 5 MB.' })
  })

  it('refuses a corrupt photo instead of storing it', async () => {
    const broken = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 7)])
    const result = await prepareApplicantDocument(file(broken, 'photo.jpg', 'image/jpeg'))
    expect('problem' in result).toBe(true)
  })
})

describe('readDocuments', () => {
  const pdf = () => file(PDF, 'doc.pdf', 'application/pdf')

  function form(entries: Record<string, File>) {
    const data = new FormData()
    for (const [name, value] of Object.entries(entries)) data.set(name, value)
    // What a browser posts for a file input left empty.
    for (const name of ['documents.birth', 'documents.results', 'documents.photo']) {
      if (!data.has(name)) data.set(name, new File([], '', { type: 'application/octet-stream' }))
    }
    return data
  }

  it('asks Senior One and Senior Five applicants for all three documents', () => {
    for (const type of ['s1', 's5']) {
      const { errors } = readDocuments(form({}), type)
      expect(Object.keys(errors).sort()).toEqual(['documents.birth', 'documents.photo', 'documents.results'])
    }
  })

  it('lets a transfer applicant leave out the result slip', () => {
    const { documents, errors } = readDocuments(
      form({ 'documents.birth': pdf(), 'documents.photo': pdf() }),
      'transfer',
    )
    expect(errors).toEqual({})
    expect(documents.map((document) => document.kind)).toEqual(['birth', 'photo'])
  })

  it('refuses a declared type that is not allowed, before anything is sent', () => {
    const { errors } = readDocuments(
      form({ 'documents.birth': file(Buffer.from('x'), 'cert.docx', 'application/msword') }),
      'transfer',
    )
    expect(errors['documents.birth']).toMatch(/PDF or a photo/)
  })
})
