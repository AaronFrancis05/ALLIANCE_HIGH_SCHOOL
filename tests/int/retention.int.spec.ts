// @vitest-environment node
/**
 * The retention job against a real database and bucket (SRS section 6). Needs
 * `docker compose up -d`.
 *
 * Runs the job "two days from now", so a document created here counts as left behind, while
 * an application changed today is still well inside its twelve months.
 */

import { getPayload, type Payload } from 'payload'
import { PDFDocument } from 'pdf-lib'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { generateTrackingCode } from '../../src/lib/admissions-schema'
import { env } from '../../src/lib/env'
import { privateObjectKey, s3Client } from '../../src/lib/storage'
import { isPastRetention, retentionCutoff, runApplicationRetention } from '../../src/lib/retention'

let payload: Payload
const created = { applications: [] as number[], documents: [] as number[] }
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000

async function pdf(): Promise<Buffer> {
  const document = await PDFDocument.create()
  document.addPage([200, 200])
  return Buffer.from(await document.save())
}

async function storeDocument(): Promise<number> {
  const data = await pdf()
  const document = await payload.create({
    collection: 'applicationDocuments',
    data: { kind: 'birth' },
    file: { name: `${crypto.randomUUID()}.pdf`, mimetype: 'application/pdf', size: data.length, data },
    overrideAccess: true,
  })
  created.documents.push(document.id)
  return document.id
}

async function createApplication(documentId?: number) {
  const application = await payload.create({
    collection: 'applications',
    overrideAccess: true,
    data: {
      trackingCode: generateTrackingCode(),
      status: 'submitted',
      applicantType: 's1',
      applicantName: 'Retention Testcase',
      dateOfBirth: '2014-01-01',
      gender: 'female',
      classSought: 'S1',
      residence: 'day',
      previousSchool: 'Example Primary School',
      guardianName: 'Test Guardian',
      guardianPhone: '0772 000000',
      consent: true,
      documents: documentId ? [{ kind: 'birth', file: documentId }] : [],
    },
  })
  created.applications.push(application.id)
  return application
}

/** Whether a file is still in the private bucket. */
async function objectExists(key: string): Promise<boolean> {
  try {
    await s3Client().send(new HeadObjectCommand({ Bucket: env.s3.privateBucket, Key: key }))
    return true
  } catch {
    return false
  }
}

async function exists(collection: 'applications' | 'applicationDocuments', id: number): Promise<boolean> {
  const { totalDocs } = await payload.count({ collection, where: { id: { equals: id } }, overrideAccess: true })
  return totalDocs === 1
}

describe('application retention', () => {
  let old: { id: number; trackingCode: string }
  let fresh: { id: number; trackingCode: string }
  let oldDocument: number
  let orphan: number
  let oldDocumentKey: string

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    oldDocument = await storeDocument()
    const stored = await payload.findByID({ collection: 'applicationDocuments', id: oldDocument, overrideAccess: true })
    oldDocumentKey = privateObjectKey(stored)!
    old = await createApplication(oldDocument)
    const thirteenMonthsAgo = retentionCutoff(new Date(), 13).toISOString()
    await payload.update({
      collection: 'applications',
      id: old.id,
      data: { statusChangedAt: thirteenMonthsAgo },
      overrideAccess: true,
    })

    fresh = await createApplication(await storeDocument())
    orphan = await storeDocument()
  })

  afterAll(async () => {
    const applications = created.applications
    const documents = created.documents
    if (applications.length) {
      await payload.delete({ collection: 'applications', where: { id: { in: applications } }, overrideAccess: true })
    }
    if (documents.length) {
      await payload.delete({ collection: 'applicationDocuments', where: { id: { in: documents } }, overrideAccess: true })
    }
  })

  it('decides by the last status change, falling back to the last update', () => {
    const cutoff = new Date('2026-01-01T00:00:00Z')
    expect(isPastRetention({ statusChangedAt: '2025-12-31T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' }, cutoff)).toBe(true)
    expect(isPastRetention({ statusChangedAt: null, updatedAt: '2026-02-01T00:00:00Z' }, cutoff)).toBe(false)
  })

  it('the dry run reports the old application and deletes nothing', async () => {
    const report = await runApplicationRetention(payload, { apply: false, now: new Date(Date.now() + TWO_DAYS) })

    const codes = report.applications.map((application) => application.trackingCode)
    expect(codes).toContain(old.trackingCode)
    expect(codes).not.toContain(fresh.trackingCode)
    expect(report.orphanedDocuments).toBeGreaterThanOrEqual(1)
    expect(JSON.stringify(report)).not.toContain('Testcase')

    expect(await exists('applications', old.id)).toBe(true)
    expect(await exists('applicationDocuments', oldDocument)).toBe(true)
    expect(await exists('applicationDocuments', orphan)).toBe(true)
    expect(await objectExists(oldDocumentKey)).toBe(true)
  })

  it('applying deletes the old application, its document and the orphan, and nothing else', async () => {
    await runApplicationRetention(payload, { apply: true, now: new Date(Date.now() + TWO_DAYS) })

    expect(await exists('applications', old.id)).toBe(false)
    expect(await exists('applicationDocuments', oldDocument)).toBe(false)
    expect(await exists('applicationDocuments', orphan)).toBe(false)
    // The file itself is gone from the bucket, not just its record.
    expect(await objectExists(oldDocumentKey)).toBe(false)

    expect(await exists('applications', fresh.id)).toBe(true)
    const kept = await payload.findByID({ collection: 'applications', id: fresh.id, depth: 0, overrideAccess: true })
    for (const row of kept.documents ?? []) {
      expect(await exists('applicationDocuments', row.file as number)).toBe(true)
    }
  })
})
