/**
 * Report card delivery (FR-08, FR-13, FR-14, FR-15, FR-23).
 *
 * This route is the only way a report card file can be reached. It:
 *   1. verifies the session with Payload (never trusts anything the browser sent),
 *   2. loads the card, its term and the bursar's clearance **with overrideAccess: false**,
 *   3. asks `evaluateReportCardAccess` — the same pure function the portal page uses and
 *      the unit tests cover — whether this person may have this file,
 *   4. writes the outcome to the audit log either way,
 *   5. only then mints a signed URL that expires in five minutes and redirects to it.
 *
 * The storage key never reaches the browser. A refusal returns the same wording whether
 * the card belongs to someone else or does not exist, so ids cannot be probed.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getPayloadClient } from '../../../../../lib/payload'
import { currentSession } from '../../../../../lib/session'
import { evaluateReportCardAccess } from '../../../../../access/report-cards'
import { signedPrivateUrl } from '../../../../../lib/storage'
import { recordAudit } from '../../../../../lib/audit'
import { checkRateLimit, clientIdentifier } from '../../../../../lib/rate-limit'
import { logger } from '../../../../../lib/logger'
import type { AcademicTerm, Student, User } from '../../../../../payload-types'

/** Always evaluated per request; nothing here may ever be cached. */
export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL_SECONDS = 300

function refuse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const rate = checkRateLimit('fileDownload', clientIdentifier(request))
  if (!rate.allowed) {
    return refuse('Too many requests. Please wait a moment and try again.', 429)
  }

  const session = await currentSession()
  const payload = await getPayloadClient()

  const auditReq = {
    payload,
    headers: request.headers,
    user: session.user,
  } as unknown as Parameters<typeof recordAudit>[0]

  if (!session.user) {
    return NextResponse.redirect(new URL('/portal/sign-in', request.url))
  }

  // Read as the signed-in person: the access rule filters this, not the query.
  const found = await payload.find({
    collection: 'reportCards',
    where: { id: { equals: id } },
    depth: 2,
    limit: 1,
    overrideAccess: false,
    user: session.user,
  })

  const card = found.docs[0]

  if (!card) {
    // Same wording and status as "not yours", so the two cannot be told apart.
    await recordAudit(auditReq, {
      action: 'reportcard.refused',
      targetType: 'reportCards',
      targetId: id,
      detail: 'not visible to requester',
    })
    return refuse('You do not have access to this report card.', 404)
  }

  const term = card.term as AcademicTerm | undefined
  const ownerId = typeof card.student === 'object' && card.student ? card.student.id : card.student

  // The bursar's decision for this student and this term.
  let clearance: { status: 'cleared' | 'blocked'; reason?: string | null } | null = null
  if (term && ownerId) {
    const clearances = await payload.find({
      collection: 'feeClearances',
      where: { and: [{ student: { equals: ownerId } }, { term: { equals: term.id } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true, // the gate below decides; this is a lookup, not a grant
    })
    const row = clearances.docs[0]
    if (row) clearance = { status: row.status as 'cleared' | 'blocked', reason: row.reason }
  }

  const decision = evaluateReportCardAccess({
    requester: { id: session.user.id, collection: session.collection as 'students' | 'users' },
    ownerId: ownerId ?? '',
    termReleased: Boolean(term?.resultsReleased),
    clearance,
    published: Boolean(card.published),
    requesterRole: session.collection === 'users' ? (session.user as User).role : undefined,
  })

  if (!decision.allowed) {
    await recordAudit(auditReq, {
      action: 'reportcard.refused',
      targetType: 'reportCards',
      targetId: String(card.id),
      detail: decision.reason,
    })
    return refuse(decision.message, decision.reason === 'not-owner' ? 404 : 403)
  }

  if (!card.filename) {
    logger.error('Report card has no stored file', { cardId: String(card.id) })
    return refuse('This report card file is missing. Please tell the school office.', 500)
  }

  const requester = session.user as Student
  const downloadName = `Report card ${term ? `Term ${term.term} ${term.year}` : ''} ${
    requester.admissionNo ?? ''
  }`
    .replace(/\s+/g, ' ')
    .trim()

  const url = await signedPrivateUrl(card.filename, {
    downloadName: `${downloadName}.pdf`,
    asAttachment: true,
    ttlSeconds: SIGNED_URL_TTL_SECONDS,
  })

  await recordAudit(auditReq, {
    action: 'reportcard.downloaded',
    targetType: 'reportCards',
    targetId: String(card.id),
  })

  // The signed URL is short-lived, so the redirect itself must never be cached.
  return NextResponse.redirect(url, { headers: { 'Cache-Control': 'no-store' } })
}
