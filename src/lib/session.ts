/**
 * Who is making the current request (FR-10, FR-11).
 *
 * Payload sets its own signed cookie on sign-in. These helpers hand that cookie back to
 * Payload's `auth` so the session is verified by Payload, never trusted from the browser.
 *
 * Students and staff are separate collections, so `currentStudent()` can never return a
 * staff account and vice versa — a structural guarantee rather than a condition someone
 * has to remember to write.
 */

import { cache } from 'react'
import { headers as nextHeaders } from 'next/headers'
import { getPayloadClient } from './payload'
import type { Student, User } from '../payload-types'

export interface Session {
  user: Student | User | null
  collection: 'students' | 'users' | null
}

/**
 * Verifies the session cookie against Payload. Memoised per request, so several server
 * components on one page cost a single check.
 */
export const currentSession = cache(async (): Promise<Session> => {
  const payload = await getPayloadClient()
  const requestHeaders = await nextHeaders()

  try {
    const { user } = await payload.auth({ headers: requestHeaders })
    if (!user) return { user: null, collection: null }

    return {
      user: user as unknown as Student | User,
      collection: user.collection as 'students' | 'users',
    }
  } catch {
    // A malformed or expired cookie is simply "not signed in".
    return { user: null, collection: null }
  }
})

/** The signed-in student, or null. Never returns a staff account. */
export const currentStudent = cache(async (): Promise<Student | null> => {
  const session = await currentSession()
  return session.collection === 'students' ? (session.user as Student) : null
})

/** The signed-in staff member, or null. Never returns a student. */
export const currentStaff = cache(async (): Promise<User | null> => {
  const session = await currentSession()
  return session.collection === 'users' ? (session.user as User) : null
})
