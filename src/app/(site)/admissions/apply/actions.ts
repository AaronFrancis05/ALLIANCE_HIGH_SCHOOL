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
 *   - documents come in with the form, so they are attached by the server and never by an
 *     id the browser supplies; each is checked, cleaned and renamed first (document-intake.ts);
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
import { APPLICATION_DOCUMENTS, chosenFile, type ChosenDocument } from '../../../../lib/application-documents'
import { prepareApplicantDocument } from '../../../../lib/document-intake'
import type { IncomingFile } from '../../../../lib/upload-safety'
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

/** A browser cannot refill a file input, so say so whenever the form comes back. */
const CHOOSE_FILES_AGAIN = ' Please choose the documents again.'

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

type Payload = Awaited<ReturnType<typeof getPayloadClient>>

/** Checks and cleans every document. Returns the problems keyed by input name, if any. */
async function prepareDocuments(documents: ChosenDocument[]) {
  const prepared: { kind: ChosenDocument['kind']; file: IncomingFile }[] = []
  const errors: FieldErrors = {}
  for (const document of documents) {
    const result = await prepareApplicantDocument(document.file)
    if ('problem' in result) errors[document.field] = result.problem
    else prepared.push({ kind: document.kind, file: result.file })
  }
  return { prepared, errors }
}

async function storeDocuments(payload: Payload, prepared: { kind: ChosenDocument['kind']; file: IncomingFile }[]) {
  const stored: { kind: ChosenDocument['kind']; id: number }[] = []
  try {
    for (const { kind, file } of prepared) {
      const document = await payload.create({
        collection: 'applicationDocuments',
        data: { kind },
        file,
        // Public create is denied on the collection; the file has been checked above.
        overrideAccess: true,
      })
      stored.push({ kind, id: document.id })
    }
    return stored
  } catch (error) {
    await removeDocuments(payload, stored.map((document) => document.id))
    throw error
  }
}

/** Removes stored documents when the application they belong to could not be saved. */
async function removeDocuments(payload: Payload, ids: number[]) {
  if (!ids.length) return
  await payload
    .delete({ collection: 'applicationDocuments', where: { id: { in: ids } }, overrideAccess: true })
    .catch((error: unknown) => {
      logger.error('Orphaned application documents could not be removed', {
        count: ids.length,
        reason: error instanceof Error ? error.name : 'unknown',
      })
    })
}

async function unusedTrackingCode(payload: Payload) {
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
  const choseFiles = APPLICATION_DOCUMENTS.some((rule) => chosenFile(formData, rule.field))
  const again = choseFiles ? CHOOSE_FILES_AGAIN : ''

  // Real visitors never see this field, so anything in it came from a bot.
  if (typeof formData.get('website') === 'string' && formData.get('website') !== '') {
    logger.warn('Application honeypot filled; submission dropped')
    return { status: 'error', message: UNAVAILABLE + again, values }
  }

  const requestHeaders = await headers()
  const identifier = clientIdentifier(new Request('http://apply', { headers: requestHeaders }))
  const rate = checkRateLimit('application', identifier)
  if (!rate.allowed) {
    return {
      status: 'error',
      message: `Too many applications have been sent from this connection. Please wait ${rate.retryAfter} seconds and try again.${again}`,
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
      message: `Some answers need attention. Please check the highlighted questions.${again}`,
      errors: parsed.errors,
      values,
    }
  }

  const { prepared, errors: documentErrors } = await prepareDocuments(parsed.documents)
  if (Object.keys(documentErrors).length) {
    return {
      status: 'error',
      message: `A document could not be accepted.${CHOOSE_FILES_AGAIN}`,
      errors: documentErrors,
      values,
    }
  }

  let stored: { kind: ChosenDocument['kind']; id: number }[] = []
  try {
    stored = await storeDocuments(payload, prepared)
    const trackingCode = await unusedTrackingCode(payload)
    const application = await payload.create({
      collection: 'applications',
      data: {
        ...toApplicationData(parsed.data),
        trackingCode,
        status: 'submitted',
        documents: stored.map((document) => ({ kind: document.kind, file: document.id })),
      },
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
    await removeDocuments(payload, stored.map((document) => document.id))
    logger.error('Application could not be saved', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
    return { status: 'error', message: UNAVAILABLE + again, values }
  }
}
