/**
 * e-Library file delivery (FR-08, FR-09, FR-23).
 *
 * The only way a library file can be reached. It follows the report-card route:
 *   1. verifies the session with Payload (a signed-out visitor is allowed, for public items),
 *   2. loads the resource **with overrideAccess: false**, so `readResources` filters it,
 *   3. asks `canOpenResource`, the same unit-tested rule, whether this person may have it,
 *   4. only then mints a signed URL that expires in five minutes and redirects to it.
 *
 * Restricted downloads and every refusal are audited; public downloads are not, since
 * anyone may take them and logging each one would bury the entries that matter.
 *
 * A refusal reads the same whether the item is someone else's or does not exist, so ids
 * cannot be probed.
 */

import path from 'path'
import { NextResponse, type NextRequest } from 'next/server'
import { getPayloadClient } from '../../../../../lib/payload'
import { currentSession } from '../../../../../lib/session'
import { canOpenResource, type SchoolClass } from '../../../../../access/resources'
import { privateObjectKey, signedPrivateUrl } from '../../../../../lib/storage'
import { recordAudit } from '../../../../../lib/audit'
import { checkRateLimit, clientIdentifier } from '../../../../../lib/rate-limit'
import { logger } from '../../../../../lib/logger'

/** Always evaluated per request; nothing here may ever be cached. */
export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL_SECONDS = 300

const NOT_AVAILABLE = 'This file is not available to you.'

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

  // Read as the requester, or as nobody: the access rule filters this, not the query.
  const found = await payload.find({
    collection: 'resources',
    where: { id: { equals: id } },
    depth: 0,
    limit: 1,
    overrideAccess: false,
    ...(session.user ? { user: session.user } : {}),
  })

  const resource = found.docs[0]

  if (!resource) {
    // A signed-out visitor may simply need to sign in; this says nothing about the id.
    if (!session.user) {
      return NextResponse.redirect(new URL('/portal/sign-in', request.url))
    }
    await recordAudit(auditReq, {
      action: 'resource.refused',
      targetType: 'resources',
      targetId: id,
      detail: 'not visible to requester',
    })
    return refuse(NOT_AVAILABLE, 404)
  }

  const allowed = canOpenResource(session.user, {
    visibility: resource.visibility,
    classes: resource.classes as SchoolClass[] | null | undefined,
  })

  if (!allowed) {
    await recordAudit(auditReq, {
      action: 'resource.refused',
      targetType: 'resources',
      targetId: String(resource.id),
      detail: 'rule refused',
    })
    return refuse(NOT_AVAILABLE, 404)
  }

  const key = privateObjectKey(resource)
  if (!key) {
    // A link-only resource (a YouTube lesson, say) has no file to hand out.
    return refuse('This resource has no file to download.', 404)
  }

  // Titles are typed by editors; keep the saved name to characters every header accepts.
  const safeTitle = resource.title.replace(/[^\w .,()-]+/g, ' ').replace(/\s+/g, ' ').trim()
  const extension = path.extname(resource.filename ?? '') || '.pdf'
  const url = await signedPrivateUrl(key, {
    downloadName: `${safeTitle || 'Resource'}${extension}`,
    asAttachment: true,
    ttlSeconds: SIGNED_URL_TTL_SECONDS,
  })

  if (resource.visibility !== 'public') {
    await recordAudit(auditReq, {
      action: 'resource.downloaded',
      targetType: 'resources',
      targetId: String(resource.id),
    })
  }

  try {
    await payload.update({
      collection: 'resources',
      id: resource.id,
      data: { downloads: (resource.downloads ?? 0) + 1 },
      depth: 0,
      // The counter is read-only to every user; the system keeps it.
      overrideAccess: true,
    })
  } catch (error) {
    // A missed count must never cost the student their file.
    logger.error('Could not count a resource download', { resourceId: String(resource.id), error })
  }

  // The signed URL is short-lived, so the redirect itself must never be cached.
  return NextResponse.redirect(url, { headers: { 'Cache-Control': 'no-store' } })
}
