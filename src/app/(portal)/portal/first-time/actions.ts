'use server'

/**
 * First-time sign-in (FR-10, A07): a student whose record the school has created proves who
 * they are with a code emailed to the addresses on that record, then chooses a password.
 *
 * Rules enforced here:
 *   - input is validated on the server with Zod;
 *   - asking for a code always gets the same answer, whether or not the admission number
 *     exists, has an email address or is already set up, so accounts cannot be enumerated;
 *   - codes are rate-limited per client and per account, and at most one a minute is sent;
 *   - a code is checked in constant time, allows five tries and lasts fifteen minutes, and
 *     the tries for one account run one at a time (see student-session.ts);
 *   - every code sent, refusal and completion is written to the audit log, without the
 *     admission number or any email address (NFR-05).
 */

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { Payload } from 'payload'
import { getPayloadClient } from '../../../../lib/payload'
import { recordAudit } from '../../../../lib/audit'
import { env } from '../../../../lib/env'
import { logger } from '../../../../lib/logger'
import { checkRateLimit, clientIdentifier } from '../../../../lib/rate-limit'
import { setStudentSessionCookie, withStudentSessionLock } from '../../../../lib/student-session'
import {
  CODE_LIFETIME_MS,
  canSendAnotherCode,
  checkSetupCode,
  generateSetupCode,
  hashSetupCode,
  setupCodeMessage,
  setupCodeRecipients,
} from '../../../../lib/student-setup'
import { passwordProblem } from '../../../../lib/student-password'
import type { Student } from '../../../../payload-types'

export interface FirstTimeState {
  step: 'number' | 'code'
  /** Carried in the form, never in the URL. */
  admissionNo?: string
  error?: string
  notice?: string
}

const admissionNoSchema = z
  .string()
  .trim()
  .min(3, 'Enter your admission number.')
  .max(40, 'That admission number is too long.')

const completeSchema = z
  .object({
    admissionNo: admissionNoSchema,
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter the 6-digit code from the email.'),
    password: z.string().superRefine((value, context) => {
      const problem = passwordProblem(value)
      if (problem) context.addIssue({ code: 'custom', message: problem })
    }),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, { message: 'The two passwords do not match.' })

/** Said whatever happened, so the answer gives nothing away about the account. */
const CODE_SENT_NOTICE =
  'If that admission number is waiting to be set up, a 6-digit code is on its way to the email addresses the school holds for it: yours, or your parent’s or guardian’s. It can take a minute or two.'

const CODE_REJECTED = 'That code is not right, or it has expired. Check the latest email, or send a new code.'

type AuditReq = Parameters<typeof recordAudit>[0]

async function auditRequest(payload: Payload, user: Student | null = null): Promise<AuditReq> {
  // A PayloadRequest-shaped object, which is all recordAudit reads.
  return { payload, headers: await headers(), user } as unknown as AuditReq
}

async function clientId(): Promise<string> {
  return clientIdentifier(new Request('http://portal', { headers: await headers() }))
}

/** The student record, with the hidden code fields, or null. */
async function findStudent(payload: Payload, admissionNo: string): Promise<Student | null> {
  const { docs } = await payload.find({
    collection: 'students',
    where: { username: { equals: admissionNo.toLowerCase() } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
  })
  return docs[0] ?? null
}

function waitingForSetUp(student: Student | null): student is Student {
  return Boolean(student && student.status === 'active' && !student.portalSetUp)
}

export async function requestSetupCodeAction(
  _previous: FirstTimeState,
  formData: FormData,
): Promise<FirstTimeState> {
  const parsed = admissionNoSchema.safeParse(formData.get('admissionNo'))
  if (!parsed.success) {
    return { step: 'number', error: parsed.error.issues[0]?.message }
  }
  const admissionNo = parsed.data

  const client = await clientId()
  const perClient = checkRateLimit('login', client)
  const perAccount = checkRateLimit('otp', `${client}:${admissionNo.toLowerCase()}`)
  if (!perClient.allowed || !perAccount.allowed) {
    const wait = Math.max(perClient.retryAfter, perAccount.retryAfter)
    return { step: 'number', admissionNo, error: `Too many requests. Please wait ${wait} seconds and try again.` }
  }

  const payload = await getPayloadClient()
  const student = await findStudent(payload, admissionNo)
  const recipients = student ? setupCodeRecipients(student) : []

  if (waitingForSetUp(student) && recipients.length > 0 && canSendAnotherCode(student.setupCodeSentAt)) {
    const code = generateSetupCode()
    const now = Date.now()
    await payload.update({
      collection: 'students',
      id: student.id,
      data: {
        setupCodeHash: hashSetupCode(env.payloadSecret(), student.id, code),
        setupCodeExpiresAt: new Date(now + CODE_LIFETIME_MS).toISOString(),
        setupCodeAttempts: 0,
        setupCodeSentAt: new Date(now).toISOString(),
      },
      overrideAccess: true,
    })

    const message = setupCodeMessage(code)
    try {
      // One email each, so no family member sees another's address.
      for (const to of recipients) {
        await payload.sendEmail({ to, subject: message.subject, text: message.text })
      }
      await recordAudit(await auditRequest(payload), {
        action: 'student.setup-code-sent',
        targetType: 'students',
        targetId: String(student.id),
        detail: `${recipients.length} address(es)`,
      })
    } catch (error) {
      logger.error('First-time sign-in code could not be emailed', { error })
      return { step: 'number', admissionNo, error: 'The email could not be sent just now. Please try again in a minute.' }
    }
  } else if (student && waitingForSetUp(student) && recipients.length === 0) {
    // Nothing to send to. The office needs to add an email address to the record.
    await recordAudit(await auditRequest(payload), {
      action: 'student.setup-refused',
      targetType: 'students',
      targetId: String(student.id),
      detail: 'no email address on record',
    })
  }

  return { step: 'code', admissionNo, notice: CODE_SENT_NOTICE }
}

export async function completeSetupAction(
  _previous: FirstTimeState,
  formData: FormData,
): Promise<FirstTimeState> {
  const admissionNo = String(formData.get('admissionNo') ?? '').trim()
  const parsed = completeSchema.safeParse({
    admissionNo,
    code: formData.get('code'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) {
    return { step: 'code', admissionNo, error: parsed.error.issues[0]?.message }
  }

  const rate = checkRateLimit('login', await clientId())
  if (!rate.allowed) {
    return { step: 'code', admissionNo, error: `Too many attempts. Please wait ${rate.retryAfter} seconds and try again.` }
  }

  const payload = await getPayloadClient()
  const { code, password } = parsed.data

  // Checking the code and setting the password run one at a time per account, so parallel
  // guesses cannot slip past the five-try limit.
  const outcome = await withStudentSessionLock(payload, parsed.data.admissionNo, async () => {
    const student = await findStudent(payload, parsed.data.admissionNo)
    if (!waitingForSetUp(student)) return { ok: false as const, student: null }

    const check = checkSetupCode({
      stored: {
        hash: student.setupCodeHash,
        expiresAt: student.setupCodeExpiresAt,
        attempts: student.setupCodeAttempts,
      },
      code,
      studentId: student.id,
      secret: env.payloadSecret(),
    })

    if (check !== 'ok') {
      await payload.update({
        collection: 'students',
        id: student.id,
        data: { setupCodeAttempts: (student.setupCodeAttempts ?? 0) + 1 },
        overrideAccess: true,
      })
      await recordAudit(await auditRequest(payload), {
        action: 'student.setup-refused',
        targetType: 'students',
        targetId: String(student.id),
        detail: `code ${check}`,
      })
      return { ok: false as const, student }
    }

    await payload.update({
      collection: 'students',
      id: student.id,
      data: {
        password,
        portalSetUp: true,
        setupCodeHash: null,
        setupCodeExpiresAt: null,
        setupCodeAttempts: null,
        setupCodeSentAt: null,
      },
      overrideAccess: true,
    })

    const login = await payload.login({
      collection: 'students',
      data: { username: parsed.data.admissionNo, password },
    })
    return { ok: true as const, student, login }
  })

  if (!outcome.ok) {
    return { step: 'code', admissionNo, error: CODE_REJECTED }
  }

  await recordAudit(await auditRequest(payload, outcome.student), {
    action: 'student.setup-completed',
    targetType: 'students',
    targetId: String(outcome.student.id),
  })

  if (outcome.login.token) {
    await setStudentSessionCookie(payload, outcome.login.token, outcome.login.exp)
    redirect('/portal')
  }
  redirect('/portal/sign-in')
}
