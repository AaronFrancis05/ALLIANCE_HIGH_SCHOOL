/**
 * Deleting applications once the school no longer needs them (SRS section 6).
 *
 * The rule, set by the school: every application, whatever its outcome, is deleted twelve
 * months after its last status change, together with its documents. An admitted student's
 * details live on in the Students collection, so the application itself is not needed.
 *
 * Documents left without an application (a submission that failed half way, and whose
 * clean-up also failed) are deleted after a day.
 *
 * Nothing is deleted unless the caller asks for it: the default is a dry run that reports
 * what would go. Reports carry references and counts only, never names.
 */

import type { Payload, Where } from 'payload'
import { recordAudit } from './audit'

export const APPLICATION_RETENTION_MONTHS = 12

/** How old an unlinked document must be before it counts as left behind. */
const ORPHAN_GRACE_HOURS = 24

export function retentionCutoff(now: Date, months = APPLICATION_RETENTION_MONTHS): Date {
  const cutoff = new Date(now)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months)
  return cutoff
}

interface RetentionCandidate {
  statusChangedAt?: string | null
  updatedAt: string
}

/** Rows saved before `statusChangedAt` existed fall back to their last update. */
export function isPastRetention(application: RetentionCandidate, cutoff: Date): boolean {
  const lastChange = application.statusChangedAt ?? application.updatedAt
  return new Date(lastChange).getTime() < cutoff.getTime()
}

export interface RetentionReport {
  applied: boolean
  cutoff: string
  applications: { trackingCode: string; status: string; lastChange: string }[]
  byStatus: Record<string, number>
  documents: number
  orphanedDocuments: number
}

function documentIds(documents: unknown): number[] {
  if (!Array.isArray(documents)) return []
  return documents
    .map((row: { file?: number | { id: number } | null }) => (typeof row.file === 'object' ? row.file?.id : row.file))
    .filter((id): id is number => typeof id === 'number')
}

export async function runApplicationRetention(
  payload: Payload,
  options: { apply: boolean; now?: Date },
): Promise<RetentionReport> {
  const now = options.now ?? new Date()
  const cutoff = retentionCutoff(now)
  const before = cutoff.toISOString()

  const where: Where = {
    or: [
      { statusChangedAt: { less_than: before } },
      { and: [{ statusChangedAt: { exists: false } }, { updatedAt: { less_than: before } }] },
    ],
  }
  const found = await payload.find({
    collection: 'applications',
    where,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: { trackingCode: true, status: true, statusChangedAt: true, updatedAt: true, documents: true },
  })
  // The query does the work; this re-checks every row against the rule before anything goes.
  const expired = found.docs.filter((application) => isPastRetention(application, cutoff))

  const linked = new Set<number>()
  const all = await payload.find({
    collection: 'applications',
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: { documents: true },
  })
  for (const application of all.docs) for (const id of documentIds(application.documents)) linked.add(id)

  const orphanBefore = new Date(now.getTime() - ORPHAN_GRACE_HOURS * 60 * 60 * 1000).toISOString()
  const unlinked = await payload.find({
    collection: 'applicationDocuments',
    where: { createdAt: { less_than: orphanBefore } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: { kind: true },
  })
  const orphans = unlinked.docs.map((document) => document.id).filter((id) => !linked.has(id))

  const report: RetentionReport = {
    applied: options.apply,
    cutoff: before,
    applications: expired.map((application) => ({
      trackingCode: application.trackingCode,
      status: application.status,
      lastChange: application.statusChangedAt ?? application.updatedAt,
    })),
    byStatus: {},
    documents: expired.reduce((total, application) => total + documentIds(application.documents).length, 0),
    orphanedDocuments: orphans.length,
  }
  for (const application of expired) report.byStatus[application.status] = (report.byStatus[application.status] ?? 0) + 1

  if (!options.apply) return report

  for (const application of expired) {
    const ids = documentIds(application.documents)
    // The application goes first, so no record is ever left pointing at a deleted file.
    await payload.delete({ collection: 'applications', id: application.id, overrideAccess: true })
    if (ids.length) {
      await payload.delete({ collection: 'applicationDocuments', where: { id: { in: ids } }, overrideAccess: true })
    }
  }
  if (orphans.length) {
    await payload.delete({ collection: 'applicationDocuments', where: { id: { in: orphans } }, overrideAccess: true })
  }

  await recordAudit({ payload, headers: new Headers(), user: null } as unknown as Parameters<typeof recordAudit>[0], {
    action: 'retention.applied',
    targetType: 'applications',
    detail: `${expired.length} applications, ${report.documents + orphans.length} documents deleted`,
  })

  return report
}
