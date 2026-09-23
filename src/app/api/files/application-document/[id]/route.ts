/**
 * Application document delivery (FR-17, FR-23).
 *
 * The only way a birth certificate, result slip or applicant photo can be opened. It follows
 * the report-card route:
 *   1. verifies the session with Payload,
 *   2. asks `canOpenApplicationDocument`, the unit-tested rule, whether this person may open
 *      admissions documents at all,
 *   3. loads the document **with overrideAccess: false**, so the collection rule applies too,
 *   4. only then mints a signed URL that expires in five minutes and redirects to it.
 *
 * Every opening and every refusal is audited. A refusal reads the same whether the document
 * exists or not, so ids cannot be probed.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getPayloadClient } from '../../../../../lib/payload'
import { currentSession } from '../../../../../lib/session'
import { canOpenApplicationDocument } from '../../../../../access/admissions'
import type { StaffUser, StudentUser } from '../../../../../access/roles'
import { privateObjectKey, signedPrivateUrl } from '../../../../../lib/storage'
import { recordAudit } from '../../../../../lib/audit'
import { checkRateLimit, clientIdentifier } from '../../../../../lib/rate-limit'

/** Always evaluated per request; nothing here may ever be cached. */
export const dynamic = 'force-dynamic'

const NOT_AVAILABLE = 'This file is not available to you.'

const KIND_NAMES: Record<string, string> = {
  birth: 'Birth certificate',
  results: 'Result slip',
  photo: 'Passport photograph',
  other: 'Document',
}

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

  if (!canOpenApplicationDocument(session.user as StaffUser | StudentUser | null)) {
    await recordAudit(auditReq, {
      action: 'application.document-refused',
      targetType: 'applicationDocuments',
      targetId: id,
      detail: session.user ? 'rule refused' : 'not signed in',
    })
    return refuse(NOT_AVAILABLE, 404)
  }

  const found = await payload.find({
    collection: 'applicationDocuments',
    where: { id: { equals: id } },
    depth: 0,
    limit: 1,
    overrideAccess: false,
    user: session.user,
  })
  const document = found.docs[0]
  const key = document ? privateObjectKey(document) : null

  if (!document || !key) {
    await recordAudit(auditReq, {
      action: 'application.document-refused',
      targetType: 'applicationDocuments',
      targetId: id,
      detail: 'not found',
    })
    return refuse(NOT_AVAILABLE, 404)
  }

  const extension = document.filename?.split('.').pop() ?? 'pdf'
  const url = await signedPrivateUrl(key, {
    downloadName: `${KIND_NAMES[document.kind] ?? 'Document'}.${extension}`,
    // Opened in the browser tab, so the officer can read it without filling their downloads.
    asAttachment: false,
  })

  await recordAudit(auditReq, {
    action: 'application.document-opened',
    targetType: 'applicationDocuments',
    targetId: String(document.id),
  })

  return NextResponse.redirect(url, { headers: { 'Cache-Control': 'no-store' } })
}
