/**
 * Starting a student's portal session (FR-10, A07).
 *
 * Shared by sign-in and first-time sign-in. Kept out of the portal's `'use server'` files on
 * purpose: everything exported from one of those becomes an action the browser can call.
 */

import type { Payload } from 'payload'
import { withSessionLock } from './session-cookie'

export { sessionCookieName, setSessionCookie as setStudentSessionCookie } from './session-cookie'

/**
 * Runs work that rewrites a student's session list, one at a time per account. Keyed on the
 * lower-cased admission number, which is the portal username.
 */
export function withStudentSessionLock<T>(payload: Payload, admissionNo: string, work: () => Promise<T>) {
  return withSessionLock(payload, `student-sessions:${admissionNo.toLowerCase()}`, work)
}
