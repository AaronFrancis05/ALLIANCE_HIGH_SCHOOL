'use server'

/**
 * Student sign-in and sign-out (FR-10, FR-11, FR-23, A07).
 *
 * Rules enforced here:
 *   - the admission number and password are validated on the server with Zod;
 *   - attempts are rate-limited per client, on top of Payload's own five-attempt lockout;
 *   - a failure never says whether the admission number exists, so accounts cannot be
 *     enumerated;
 *   - every attempt, successful or not, is written to the audit log;
 *   - sign-ins and sign-outs for one account run one at a time, across every server, so a
 *     second device signing in at the same moment cannot wipe out the first one's session
 *     (see key-lock.ts);
 *   - signing out revokes the session on the server, not just the browser's cookie, so a
 *     copied cookie on a shared phone stops working at once;
 *   - no personal data is put in a log line or an error message (NFR-05).
 */

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createLocalReq, logoutOperation, type Payload } from 'payload'
import { z } from 'zod'
import { getPayloadClient } from '../../../lib/payload'
import { recordAudit } from '../../../lib/audit'
import { checkRateLimit, clientIdentifier } from '../../../lib/rate-limit'
import { logger } from '../../../lib/logger'
import { withSharedKeyLock, type LockPool } from '../../../lib/key-lock'
import { currentStudent } from '../../../lib/session'

const signInSchema = z.object({
  admissionNo: z
    .string()
    .trim()
    .min(3, 'Enter your admission number.')
    .max(40, 'That admission number is too long.'),
  password: z.string().min(1, 'Enter your password.').max(200, 'That password is too long.'),
})

export interface SignInState {
  error?: string
}

/**
 * Runs work that rewrites a student's session list, one at a time per account. Keyed on the
 * lower-cased admission number, which is also the portal username.
 */
function withStudentSessionLock<T>(payload: Payload, admissionNo: string, work: () => Promise<T>) {
  // The Postgres adapter keeps its node-postgres pool here; the type does not expose it.
  const { pool } = payload.db as unknown as { pool: LockPool }
  return withSharedKeyLock(pool, `student-sessions:${admissionNo.toLowerCase()}`, work)
}

/** Deliberately identical for a wrong number and a wrong password. */
const CREDENTIALS_REJECTED = 'That admission number and password do not match. Please try again.'

export async function signInAction(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    admissionNo: formData.get('admissionNo'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check what you entered.' }
  }

  const requestHeaders = await headers()
  const identifier = clientIdentifier(new Request('http://portal', { headers: requestHeaders }))
  const rate = checkRateLimit('login', identifier)

  if (!rate.allowed) {
    return {
      error: `Too many sign-in attempts. Please wait ${rate.retryAfter} seconds and try again.`,
    }
  }

  const payload = await getPayloadClient()
  // A PayloadRequest-shaped object, which is all recordAudit reads.
  const auditReq = { payload, headers: requestHeaders, user: null } as unknown as Parameters<
    typeof recordAudit
  >[0]

  try {
    const result = await withStudentSessionLock(payload, parsed.data.admissionNo, () =>
      payload.login({
        collection: 'students',
        data: { username: parsed.data.admissionNo, password: parsed.data.password },
      }),
    )

    if (!result.token || !result.user) {
      await recordAudit(auditReq, { action: 'student.login-failed', detail: 'no token issued' })
      return { error: CREDENTIALS_REJECTED }
    }

    // A suspended or former student keeps their record but loses portal access.
    if (result.user.status !== 'active') {
      await recordAudit(auditReq, {
        action: 'student.login-failed',
        targetType: 'students',
        targetId: String(result.user.id),
        detail: `account status: ${result.user.status}`,
      })
      return {
        error:
          'This account is not active at the moment. Please speak to the school office.',
      }
    }

    const store = await cookies()
    store.set({
      name: `${payload.config.cookiePrefix ?? 'payload'}-token`,
      value: result.token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: result.exp ? result.exp - Math.floor(Date.now() / 1000) : 60 * 60 * 2,
    })

    await recordAudit(
      { ...auditReq, user: result.user } as unknown as Parameters<typeof recordAudit>[0],
      { action: 'student.login', targetType: 'students', targetId: String(result.user.id) },
    )
  } catch (error) {
    // Payload throws for both a wrong password and a locked account.
    logger.warn('Student sign-in refused', { reason: error instanceof Error ? error.name : 'unknown' })
    await recordAudit(auditReq, { action: 'student.login-failed' })
    return { error: CREDENTIALS_REJECTED }
  }

  redirect('/portal')
}

export async function signOutAction(): Promise<void> {
  const payload = await getPayloadClient()
  const student = await currentStudent()

  if (student?.username) {
    try {
      // Payload's own logout removes this browser's session from the account, so the
      // token is refused even if someone kept a copy of the cookie.
      await withStudentSessionLock(payload, student.username, async () => {
        const req = await createLocalReq({ user: { ...student, collection: 'students' } }, payload)
        await logoutOperation({ collection: payload.collections.students, req })
      })
      await recordAudit(
        { payload, headers: await headers(), user: student } as unknown as Parameters<
          typeof recordAudit
        >[0],
        { action: 'student.logout', targetType: 'students', targetId: String(student.id) },
      )
    } catch (error) {
      // Still clear the cookie below; the session then lapses when its token expires.
      logger.error('Student session could not be revoked on sign-out', {
        reason: error instanceof Error ? error.name : 'unknown',
      })
    }
  }

  const store = await cookies()
  store.delete(`${payload.config.cookiePrefix ?? 'payload'}-token`)
  redirect('/portal/sign-in')
}
