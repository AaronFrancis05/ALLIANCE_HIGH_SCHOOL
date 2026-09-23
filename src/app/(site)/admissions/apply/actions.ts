'use server'

/**
 * Online application submission (FR-16, FR-18, A04).
 *
 * Rules enforced here:
 *   - the form is checked with the same parser and schema the browser uses, and nothing
 *     the browser decided is trusted;
 *   - submissions are rate-limited per client, and a hidden honeypot field turns bots away;
 *   - nothing is accepted while the admissions office has applications switched off;
 *   - the public cannot create applications through the API (create is denied), so this
 *     action writes with overrideAccess after doing its own checks;
 *   - the submission is audited, and no personal data goes into a log line or error (NFR-05).
 */

import { headers } from 'next/headers'
import type { PayloadRequest } from 'payload'
import { getPayloadClient } from '../../../../lib/payload'
import { recordAudit } from '../../../../lib/audit'
import { checkRateLimit, clientIdentifier } from '../../../../lib/rate-limit'
import { logger } from '../../../../lib/logger'
import { classSoughtFor, generateTrackingCode, PLE_SUBJECTS, type ApplicationInput } from '../../../../lib/admissions-schema'
import { parseApplicationForm, type FieldErrors } from '../../../../lib/application-form'
import type { Application } from '../../../../payload-types'

export type ApplyState =
  | { status: 'idle' }
  | {
      status: 'error'
      message?: string
      errors?: FieldErrors
      /** What was posted, so the form can be filled back in rather than wiped. */
      values?: Record<string, string>
    }
  | { status: 'submitted'; trackingCode: string }

const UNAVAILABLE =
  'Your application could not be sent just now. Please try again in a few minutes, or contact the admissions office.'

/** Tries a few codes in the unlikely case one is already taken. */
const TRACKING_CODE_ATTEMPTS = 5

function postedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  for (const [name, value] of formData.entries()) {
    if (typeof value === 'string' && name !== 'website' && !name.startsWith('$')) values[name] = value
  }
  return values
}

type ApplicationData = Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'trackingCode' | 'status'>

/** Maps the checked form onto the applications collection. */
function toApplicationData(input: ApplicationInput): ApplicationData {
  const base = {
    applicantType: input.applicantType,
    applicantName: `${input.firstName} ${input.lastName}`,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    classSought: classSoughtFor(input) as Application['classSought'],
    residence: input.residence,
    previousSchool: input.formerSchool,
    guardianName: input.guardianName,
    guardianPhone: input.guardianPhone,
    guardianEmail: input.guardianEmail || null,
    comment: input.comment || null,
    consent: input.consent,
  }

  if (input.applicantType === 's1') {
    return {
      ...base,
      pleIndexNumber: input.pleIndexNumber,
      pleYear: input.pleYear ?? null,
      pleAggregate: input.pleAggregate,
      pleGrades: PLE_SUBJECTS.map((subject) => ({
        subject: subject.label,
        grade: input.pleGrades[subject.key],
      })),
    }
  }

  if (input.applicantType === 's5') {
    return {
      ...base,
      uceIndexNumber: input.uceIndexNumber,
      uceYear: input.uceYear ?? null,
      uceResults: input.uceResults,
      combination: input.combination,
    }
  }

  return {
    ...base,
    currentClass: input.currentClass,
    reasonForTransfer: input.reasonForTransfer,
    lastReportSummary: input.lastReportSummary || null,
  }
}

async function unusedTrackingCode(payload: Awaited<ReturnType<typeof getPayloadClient>>) {
  for (let attempt = 0; attempt < TRACKING_CODE_ATTEMPTS; attempt += 1) {
    const code = generateTrackingCode()
    const { totalDocs } = await payload.count({
      collection: 'applications',
      where: { trackingCode: { equals: code } },
      overrideAccess: true,
    })
    if (totalDocs === 0) return code
  }
  throw new Error('No unused tracking code found')
}

export async function submitApplicationAction(
  _previous: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const values = postedValues(formData)

  // Real visitors never see this field, so anything in it came from a bot.
  if (typeof formData.get('website') === 'string' && formData.get('website') !== '') {
    logger.warn('Application honeypot filled; submission dropped')
    return { status: 'error', message: UNAVAILABLE, values }
  }

  const requestHeaders = await headers()
  const identifier = clientIdentifier(new Request('http://apply', { headers: requestHeaders }))
  const rate = checkRateLimit('application', identifier)
  if (!rate.allowed) {
    return {
      status: 'error',
      message: `Too many applications have been sent from this connection. Please wait ${rate.retryAfter} seconds and try again.`,
      values,
    }
  }

  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'admissionsSettings', depth: 0 })
  if (!settings.applicationsOpen) {
    return {
      status: 'error',
      message: 'Applications are closed at the moment, so this form cannot be sent.',
      values,
    }
  }

  const parsed = parseApplicationForm(formData)
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Some answers need attention. Please check the highlighted questions.',
      errors: parsed.errors,
      values,
    }
  }

  try {
    const trackingCode = await unusedTrackingCode(payload)
    const application = await payload.create({
      collection: 'applications',
      data: { ...toApplicationData(parsed.data), trackingCode, status: 'submitted' },
      // Public create is denied on the collection; every check has been made above.
      overrideAccess: true,
    })

    await recordAudit(
      { payload, headers: requestHeaders, user: null } as unknown as PayloadRequest,
      {
        action: 'application.submitted',
        targetType: 'applications',
        targetId: String(application.id),
        detail: `applicant type: ${parsed.data.applicantType}`,
      },
    )

    return { status: 'submitted', trackingCode }
  } catch (error) {
    logger.error('Application could not be saved', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
    return { status: 'error', message: UNAVAILABLE, values }
  }
}
