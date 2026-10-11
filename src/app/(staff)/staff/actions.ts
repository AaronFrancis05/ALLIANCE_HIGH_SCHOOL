'use server'

/**
 * Staff portal sign-in, sign-out, password and profile actions (FR-05, FR-11, FR-23, A07).
 *
 * Every staff member except the super admin signs in here; the super admin signs in at
 * /admin. The Users beforeLogin hook enforces which door is which, so this file only marks
 * its sign-ins as coming from the staff portal.
 *
 * Rules enforced here, as in the student portal:
 *   - input is validated on the server with Zod;
 *   - attempts are rate-limited per client, on top of Payload's five-attempt lockout;
 *   - a failure never says whether an email address has an account;
 *   - sign-ins, sign-outs and password changes for one account run one at a time;
 *   - signing out revokes the session on the server, not just the browser's cookie;
 *   - no personal data goes into a log line or an error message (NFR-05).
 */

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { APIError, createLocalReq, logoutOperation, type Payload } from 'payload'
import { z } from 'zod'
import { getPayloadClient } from '../../../lib/payload'
import { recordAudit } from '../../../lib/audit'
import { checkRateLimit, clientIdentifier, type RateLimitName } from '../../../lib/rate-limit'
import { logger } from '../../../lib/logger'
import { currentStaff } from '../../../lib/session'
import { clearSessionCookie, setSessionCookie } from '../../../lib/session-cookie'
import { withStaffSessionLock } from '../../../lib/staff-session'
import { passwordProblem } from '../../../lib/student-password'
import { STAFF_PORTAL_SIGN_IN, WRONG_DOOR, SWITCHED_OFF } from '../../../lib/staff-doors'
import type { User } from '../../../payload-types'

export interface FormState {
  error?: string
  success?: string
}

const emailSchema = z.string().trim().toLowerCase().email('Enter your work email address.').max(254)
const passwordSchema = z.string().min(1, 'Enter your password.').max(200, 'That password is too long.')

const signInSchema = z.object({ email: emailSchema, password: passwordSchema })

/** The same for a wrong email, a wrong password and a locked account. */
const CREDENTIALS_REJECTED =
  'That email address and password do not match, or the account is locked for 15 minutes after too many tries.'

type AuditReq = Parameters<typeof recordAudit>[0]

async function auditRequest(payload: Payload, user: User | null = null): Promise<AuditReq> {
  // A PayloadRequest-shaped object, which is all recordAudit reads.
  return { payload, headers: await headers(), user } as unknown as AuditReq
}

async function rateLimited(name: RateLimitName): Promise<string | null> {
  const identifier = clientIdentifier(new Request('http://staff', { headers: await headers() }))
  const rate = checkRateLimit(name, identifier)
  return rate.allowed ? null : `Too many attempts. Please wait ${rate.retryAfter} seconds and try again.`
}

/** The door check's refusals are shown as written; they are only reached with the right password. */
function doorRefusal(error: unknown): string | null {
  if (!(error instanceof APIError)) return null
  const known: string[] = [WRONG_DOOR.superAdmin, WRONG_DOOR.staff, SWITCHED_OFF]
  return known.includes(error.message) ? error.message : null
}

/** Signs in through the staff portal and sets the session cookie. Throws on any refusal. */
async function staffLogin(payload: Payload, email: string, password: string) {
  const result = await withStaffSessionLock(payload, email, () =>
    payload.login({
      collection: 'users',
      data: { email, password },
      context: { [STAFF_PORTAL_SIGN_IN]: true },
    }),
  )
  if (!result.token || !result.user) throw new Error('No token issued')
  await setSessionCookie(payload, result.token, result.exp)
  return result
}

export async function signInAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check what you entered.' }

  const limited = await rateLimited('login')
  if (limited) return { error: limited }

  const payload = await getPayloadClient()

  try {
    // The Users afterLogin hook writes the staff.login audit entry.
    await staffLogin(payload, parsed.data.email, parsed.data.password)
  } catch (error) {
    logger.warn('Staff sign-in refused', { reason: error instanceof Error ? error.name : 'unknown' })
    await recordAudit(await auditRequest(payload), { action: 'staff.login-failed' })
    return { error: doorRefusal(error) ?? CREDENTIALS_REJECTED }
  }

  redirect('/staff')
}

/** Removes this browser's session (or every session) from the account on the server. */
async function revokeSessions(payload: Payload, staff: User, allSessions: boolean): Promise<void> {
  await withStaffSessionLock(payload, staff.email, async () => {
    const req = await createLocalReq({ user: { ...staff, collection: 'users' } }, payload)
    await logoutOperation({ allSessions, collection: payload.collections.users, req })
  })
}

export async function signOutAction(): Promise<void> {
  const payload = await getPayloadClient()
  const staff = await currentStaff()

  if (staff) {
    try {
      await revokeSessions(payload, staff, false)
      await recordAudit(await auditRequest(payload, staff), {
        action: 'staff.logout',
        targetType: 'users',
        targetId: String(staff.id),
      })
    } catch (error) {
      // Still clear the cookie below; the session then lapses when its token expires.
      logger.error('Staff session could not be revoked on sign-out', {
        reason: error instanceof Error ? error.name : 'unknown',
      })
    }
  }

  await clearSessionCookie(payload)
  redirect('/staff/sign-in')
}

// ---------------------------------------------------------------- forgotten passwords

const RESET_SENT =
  'If that address belongs to a staff account, a link to choose a new password is on its way. It works for one hour.'

export async function forgotPasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get('email'))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Enter your work email address.' }

  const limited = await rateLimited('otp')
  if (limited) return { error: limited }

  const payload = await getPayloadClient()
  try {
    // Fails silently for an unknown address, so the reply never reveals who has an account.
    // The email's link is built by the Users collection: staff portal or admin, by account.
    await payload.forgotPassword({ collection: 'users', data: { email: parsed.data } })
    await recordAudit(await auditRequest(payload), { action: 'staff.reset-requested' })
  } catch (error) {
    logger.error('Staff password reset email could not be sent', { error })
    return { error: 'The email could not be sent just now. Please try again in a few minutes.' }
  }

  return { success: RESET_SENT }
}

const resetSchema = z.object({
  token: z.string().trim().min(10).max(200),
  password: z.string().max(200),
  confirm: z.string().max(200),
})

export async function resetPasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) return { error: 'This link is not valid. Ask for a new one below.' }

  const problem = passwordProblem(parsed.data.password)
  if (problem) return { error: problem }
  if (parsed.data.password !== parsed.data.confirm) return { error: 'The two passwords do not match.' }

  const limited = await rateLimited('login')
  if (limited) return { error: limited }

  const payload = await getPayloadClient()
  try {
    const { user } = await payload.resetPassword({
      collection: 'users',
      data: { token: parsed.data.token, password: parsed.data.password },
      overrideAccess: true,
    })
    await recordAudit(await auditRequest(payload), {
      action: 'staff.password-reset',
      targetType: 'users',
      targetId: user ? String((user as { id: unknown }).id) : undefined,
    })
  } catch (error) {
    logger.warn('Staff password reset refused', { reason: error instanceof Error ? error.name : 'unknown' })
    return { error: 'This link has expired or has already been used. Ask for a new one below.' }
  }

  // Signing in afterwards goes through the door check like any other sign-in.
  redirect('/staff/sign-in?password=set')
}

// ---------------------------------------------------------------- own profile

const nameSchema = z.string().trim().min(2, 'Enter your full name.').max(120, 'That name is too long.')

export async function updateNameAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const staff = await currentStaff()
  if (!staff) redirect('/staff/sign-in')

  const parsed = nameSchema.safeParse(formData.get('name'))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Enter your full name.' }

  const payload = await getPayloadClient()
  try {
    // As the person themselves: the collection's own rules decide what they may change.
    await payload.update({
      collection: 'users',
      id: staff.id,
      data: { name: parsed.data },
      overrideAccess: false,
      user: { ...staff, collection: 'users' },
    })
  } catch (error) {
    logger.error('Staff name could not be updated', { error })
    return { error: 'Your name could not be saved. Please try again.' }
  }

  return { success: 'Your name is saved.' }
}

const changePasswordSchema = z.object({
  current: passwordSchema,
  password: z.string().max(200),
  confirm: z.string().max(200),
})

export async function changePasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const staff = await currentStaff()
  if (!staff) redirect('/staff/sign-in')

  const parsed = changePasswordSchema.safeParse({
    current: formData.get('current'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check what you entered.' }

  const problem = passwordProblem(parsed.data.password)
  if (problem) return { error: problem }
  if (parsed.data.password !== parsed.data.confirm) return { error: 'The two new passwords do not match.' }

  const limited = await rateLimited('login')
  if (limited) return { error: limited }

  const payload = await getPayloadClient()

  // The current password is checked by signing in with it, so wrong guesses count towards
  // the five-attempt lockout like any other sign-in.
  try {
    await staffLogin(payload, staff.email, parsed.data.current)
  } catch {
    return { error: 'Your current password is not right.' }
  }

  try {
    await payload.update({
      collection: 'users',
      id: staff.id,
      data: { password: parsed.data.password },
      overrideAccess: false,
      user: { ...staff, collection: 'users' },
    })
    // Every other device is signed out, then this one is signed back in with the new password.
    await revokeSessions(payload, staff, true)
    await staffLogin(payload, staff.email, parsed.data.password)
    await recordAudit(await auditRequest(payload, staff), {
      action: 'staff.password-changed',
      targetType: 'users',
      targetId: String(staff.id),
    })
  } catch (error) {
    logger.error('Staff password could not be changed', { reason: error instanceof Error ? error.name : 'unknown' })
    return { error: 'Your password could not be changed. Please try again.' }
  }

  return { success: 'Your password is changed. Any other device you were signed in on has been signed out.' }
}
