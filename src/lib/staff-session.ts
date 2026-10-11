/**
 * Starting and ending a staff portal session (FR-05, FR-11, A07). Kept out of the staff
 * portal's `'use server'` file for the same reason as student-session.ts.
 */

import type { Payload } from 'payload'
import { withSessionLock } from './session-cookie'

/** One sign-in or sign-out at a time per staff account, keyed on the lower-cased email. */
export function withStaffSessionLock<T>(payload: Payload, email: string, work: () => Promise<T>) {
  return withSessionLock(payload, `staff-sessions:${email.trim().toLowerCase()}`, work)
}
