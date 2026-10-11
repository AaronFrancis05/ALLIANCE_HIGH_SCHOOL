/**
 * The session cookie and per-account sign-in lock shared by the student and staff portals
 * (FR-10, FR-11, A07).
 *
 * Kept out of the portals' `'use server'` files on purpose: everything exported from one of
 * those becomes an action the browser can call.
 */

import { cookies } from 'next/headers'
import type { Payload } from 'payload'
import { withSharedKeyLock, type LockPool } from './key-lock'

/**
 * Runs work that rewrites an account's session list, one at a time per account and across
 * every server, so a second device signing in at the same moment cannot wipe out the first
 * one's session.
 */
export function withSessionLock<T>(payload: Payload, key: string, work: () => Promise<T>) {
  // The Postgres adapter keeps its node-postgres pool here; the type does not expose it.
  const { pool } = payload.db as unknown as { pool: LockPool }
  return withSharedKeyLock(pool, key, work)
}

export function sessionCookieName(payload: Payload): string {
  return `${payload.config.cookiePrefix ?? 'payload'}-token`
}

/** Hands the browser the token Payload issued, as an HTTP-only cookie. */
export async function setSessionCookie(payload: Payload, token: string, exp?: number): Promise<void> {
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

export async function clearSessionCookie(payload: Payload): Promise<void> {
  const store = await cookies()
  store.delete(sessionCookieName(payload))
}
