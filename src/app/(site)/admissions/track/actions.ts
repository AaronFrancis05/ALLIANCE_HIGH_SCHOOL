'use server'

/**
 * Application tracking lookup (FR-18, A04).
 *
 * Rate-limited per client. The reference and the guardian's phone number must both match,
 * and every miss gets the same message, so neither half can be confirmed on its own.
 * The lookup is a POST, so neither value ends up in a URL, a history entry or a log.
 */

import { headers } from 'next/headers'
import { getPayloadClient } from '../../../../lib/payload'
import { checkRateLimit, clientIdentifier } from '../../../../lib/rate-limit'
import { samePhone, trackingLookupSchema, type TrackingResult } from '../../../../lib/application-tracking'

export type TrackState =
  | { status: 'idle' }
  | { status: 'error'; message: string; values?: Record<string, string> }
  | { status: 'found'; result: TrackingResult }

const NOT_FOUND =
  'We could not find an application with that reference and telephone number. Check both against the confirmation you were given.'

export async function trackApplicationAction(_previous: TrackState, formData: FormData): Promise<TrackState> {
  const values = {
    trackingCode: String(formData.get('trackingCode') ?? ''),
    guardianPhone: String(formData.get('guardianPhone') ?? ''),
  }

  const requestHeaders = await headers()
  const rate = checkRateLimit('tracking', clientIdentifier(new Request('http://track', { headers: requestHeaders })))
  if (!rate.allowed) {
    return {
      status: 'error',
      message: `Too many lookups from this connection. Please wait ${rate.retryAfter} seconds and try again.`,
      values,
    }
  }

  const parsed = trackingLookupSchema.safeParse(values)
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? NOT_FOUND, values }
  }

  const payload = await getPayloadClient()
  const found = await payload.find({
    collection: 'applications',
    where: { trackingCode: { equals: parsed.data.trackingCode } },
    depth: 0,
    limit: 1,
    // The public cannot read applications; this route makes its own check, the phone number.
    overrideAccess: true,
    select: { trackingCode: true, status: true, classSought: true, createdAt: true, interviewDate: true, guardianPhone: true },
  })
  const application = found.docs[0]

  if (!application || !samePhone(parsed.data.guardianPhone, application.guardianPhone)) {
    return { status: 'error', message: NOT_FOUND, values }
  }

  return {
    status: 'found',
    result: {
      trackingCode: application.trackingCode,
      status: application.status,
      classSought: application.classSought,
      submittedOn: application.createdAt,
      interviewDate: application.interviewDate ?? null,
    },
  }
}
