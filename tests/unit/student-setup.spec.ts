/**
 * First-time sign-in codes and staff invitation messages (FR-10, FR-05, NFR-05).
 */

import { describe, expect, it } from 'vitest'
import {
  CODE_LIFETIME_MS,
  MAX_CODE_ATTEMPTS,
  RESEND_GAP_MS,
  canSendAnotherCode,
  checkSetupCode,
  generateSetupCode,
  hashSetupCode,
  setupCodeMessage,
  setupCodeRecipients,
} from '../../src/lib/student-setup'
import { passwordProblem } from '../../src/lib/student-password'
import { inviteLink, inviteMessage, unusablePassword } from '../../src/lib/staff-invite'

const SECRET = 'test-secret'
const NOW = Date.parse('2026-10-10T08:00:00Z')

function stored(code: string, overrides: { studentId?: number; expiresIn?: number; attempts?: number } = {}) {
  return {
    hash: hashSetupCode(SECRET, overrides.studentId ?? 9, code),
    expiresAt: new Date(NOW + (overrides.expiresIn ?? CODE_LIFETIME_MS)).toISOString(),
    attempts: overrides.attempts ?? 0,
  }
}

describe('setup codes', () => {
  it('are six digits, leading zeros kept', () => {
    for (let i = 0; i < 200; i++) expect(generateSetupCode()).toMatch(/^\d{6}$/)
  })

  it('accept the right code before it expires', () => {
    expect(checkSetupCode({ stored: stored('012345'), code: '012345', studentId: 9, secret: SECRET, now: NOW })).toBe('ok')
  })

  it('refuse a wrong code', () => {
    expect(checkSetupCode({ stored: stored('012345'), code: '012346', studentId: 9, secret: SECRET, now: NOW })).toBe('wrong')
  })

  it('refuse a code issued to another student', () => {
    const other = stored('012345', { studentId: 10 })
    expect(checkSetupCode({ stored: other, code: '012345', studentId: 9, secret: SECRET, now: NOW })).toBe('wrong')
  })

  it('refuse the right code once it has expired', () => {
    const old = stored('012345', { expiresIn: -1 })
    expect(checkSetupCode({ stored: old, code: '012345', studentId: 9, secret: SECRET, now: NOW })).toBe('expired')
  })

  it('refuse even the right code after five wrong tries', () => {
    const tried = stored('012345', { attempts: MAX_CODE_ATTEMPTS })
    expect(checkSetupCode({ stored: tried, code: '012345', studentId: 9, secret: SECRET, now: NOW })).toBe('too-many')
  })

  it('refuse when no code has been sent', () => {
    expect(checkSetupCode({ stored: {}, code: '012345', studentId: 9, secret: SECRET, now: NOW })).toBe('none')
  })

  it('are stored only as a hash', () => {
    expect(stored('012345').hash).not.toContain('012345')
  })

  it('cannot be resent within a minute', () => {
    const sentAt = new Date(NOW).toISOString()
    expect(canSendAnotherCode(sentAt, NOW + RESEND_GAP_MS - 1)).toBe(false)
    expect(canSendAnotherCode(sentAt, NOW + RESEND_GAP_MS)).toBe(true)
    expect(canSendAnotherCode(null, NOW)).toBe(true)
  })
})

describe('who a code is sent to', () => {
  it('the student and every guardian, each once, ignoring blanks and nonsense', () => {
    expect(
      setupCodeRecipients({
        email: 'Pupil@Example.test ',
        guardians: [{ email: 'parent@example.test' }, { email: 'pupil@example.test' }, { email: '' }, { email: 'not-an-email' }, {}],
      }),
    ).toEqual(['pupil@example.test', 'parent@example.test'])
  })

  it('nobody, when the record has no email address', () => {
    expect(setupCodeRecipients({ email: null, guardians: [{ email: null }] })).toEqual([])
  })
})

describe('the code email', () => {
  it('carries the code and nothing that identifies the student', () => {
    const message = setupCodeMessage('482913')
    expect(message.subject).toContain('482913')
    expect(message.text).toContain('482913')
    expect(message.text).not.toMatch(/AHSN|admission number/i)
  })
})

describe('student passwords', () => {
  it('need eight characters with a letter and a number', () => {
    expect(passwordProblem('short1')).toMatch(/at least 8/)
    expect(passwordProblem('allletters')).toMatch(/letter and one number/)
    expect(passwordProblem('12345678')).toMatch(/letter and one number/)
    expect(passwordProblem('Nansana2026')).toBeNull()
  })
})

describe('staff invitations', () => {
  it('link to the admin’s set-password screen with the token', () => {
    expect(inviteLink('abc123', 'https://school.test')).toBe('https://school.test/admin/reset/abc123')
  })

  it('name the role and the link, and never a password', () => {
    const message = inviteMessage({ name: 'Grace', role: 'bursar', link: 'https://school.test/admin/reset/abc' })
    expect(message.text).toContain('Bursar')
    expect(message.text).toContain('https://school.test/admin/reset/abc')
    expect(message.text).not.toMatch(/password is/i)
  })

  it('give new accounts a long password nobody chose', () => {
    const first = unusablePassword()
    expect(first.length).toBeGreaterThanOrEqual(40)
    expect(unusablePassword()).not.toBe(first)
  })
})
