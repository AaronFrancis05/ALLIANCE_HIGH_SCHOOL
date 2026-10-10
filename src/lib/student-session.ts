/**
 * Starting a student's portal session (FR-10, A07).
 *
 * Shared by sign-in and first-time sign-in. Kept out of the portal's `'use server'` files on
 * purpose: everything exported from one of those becomes an action the browser can call.
 */

import { cookies } from 'next/headers'
import type { Payload } from 'payload'
import { withSharedKeyLock, type LockPool } from './key-lock'

/**
 * Runs work that rewrites a student's session list, one at a time per account and across
 * every server, so a second device signing in at the same moment cannot wipe out the first
 * one's session. Keyed on the lower-cased admission number, which is the portal username.
 */
export function withStudentSessionLock<T>(payload: Payload, admissionNo: string, work: () => Promise<T>) {
  // The Postgres adapter keeps its node-postgres pool here; the type does not expose it.
  const { pool } = payload.db as unknown as { pool: LockPool }
  return withSharedKeyLock(pool, `student-sessions:${admissionNo.toLowerCase()}`, work)
}

export function sessionCookieName(payload: Payload): string {
  return `${payload.config.cookiePrefix ?? 'payload'}-token`
}

/** Hands the browser the token Payload issued, as an HTTP-only cookie. */
export async function setStudentSessionCookie(payload: Payload, token: string, exp?: number): Promise<void> {
  const store = await cookies()
  store.set({
    name: sessionCookieName(payload),
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: exp ? exp - Math.floor(Date.now() / 1000) : 60 * 60 * 2,
  })
}
