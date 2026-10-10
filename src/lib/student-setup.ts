/**
 * First-time sign-in for students (FR-10, A07).
 *
 * Student records are created by the school with a password nobody knows. To set their own,
 * a student enters their admission number and is emailed a six-digit code, at the addresses
 * the school holds for them: their own and their parents' or guardians'. Admission numbers
 * are printed on ID cards, so the code is what proves the student (or their family) is the
 * one setting the password.
 *
 * Only a keyed hash of the code is stored. A code lasts fifteen minutes, allows five tries,
 * and a new one cannot be sent more than once a minute.
 */

import crypto from 'node:crypto'

export const CODE_LIFETIME_MS = 15 * 60 * 1000
export const MAX_CODE_ATTEMPTS = 5
export const RESEND_GAP_MS = 60 * 1000

const SCHOOL = 'Alliance High School Nansana'

/** A six-digit code, evenly distributed. */
export function generateSetupCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

/** Bound to the student, so a code issued to one account is useless for any other. */
export function hashSetupCode(secret: string, studentId: string | number, code: string): string {
  return crypto.createHmac('sha256', secret).update(`${studentId}:${code}`).digest('hex')
}

export interface StoredSetupCode {
  hash?: string | null
  expiresAt?: string | null
  attempts?: number | null
}

export type CodeCheck = 'ok' | 'wrong' | 'expired' | 'too-many' | 'none'

export function checkSetupCode(input: {
  stored: StoredSetupCode
  code: string
  studentId: string | number
  secret: string
  now?: number
}): CodeCheck {
  const { stored, code, studentId, secret, now = Date.now() } = input

  if (!stored.hash || !stored.expiresAt) return 'none'
  if ((stored.attempts ?? 0) >= MAX_CODE_ATTEMPTS) return 'too-many'
  if (new Date(stored.expiresAt).getTime() <= now) return 'expired'

  const expected = Buffer.from(stored.hash, 'hex')
  const given = Buffer.from(hashSetupCode(secret, studentId, code), 'hex')
  return expected.length === given.length && crypto.timingSafeEqual(expected, given) ? 'ok' : 'wrong'
}

/** Whether enough time has passed since the last code to send another. */
export function canSendAnotherCode(sentAt: string | null | undefined, now = Date.now()): boolean {
  if (!sentAt) return true
  return now - new Date(sentAt).getTime() >= RESEND_GAP_MS
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The student's own address and every guardian's, each once. */
export function setupCodeRecipients(student: {
  email?: string | null
  guardians?: { email?: string | null }[] | null
}): string[] {
  const addresses = [student.email, ...(student.guardians ?? []).map((guardian) => guardian.email)]
  const unique = new Set<string>()
  for (const address of addresses) {
    const cleaned = address?.trim().toLowerCase()
    if (cleaned && EMAIL_PATTERN.test(cleaned)) unique.add(cleaned)
  }
  return [...unique]
}

/**
 * The email carries the code only. It names neither the student nor the admission number,
 * so a mistyped guardian address on the record gives a stranger nothing useful.
 */
export function setupCodeMessage(code: string): { subject: string; text: string } {
  return {
    subject: `${code} is your ${SCHOOL} student portal code`,
    text: [
      `Your code to set up the ${SCHOOL} student portal is:`,
      '',
      `    ${code}`,
      '',
      'Enter it on the first-time sign-in page to choose a password. It works for 15 minutes.',
      '',
      'This email went to the addresses the school holds for the student, which can include a',
      'parent or guardian. If nobody in your family asked for it, you can ignore it: without',
      'the code, nobody can set the password.',
    ].join('\n'),
  }
}
