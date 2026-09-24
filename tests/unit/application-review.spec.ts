/**
 * The review workflow and the messages families get (FR-19).
 */

import { describe, expect, it, vi } from 'vitest'
import { canChangeApplicationStatus } from '../../src/access/admissions'
import type { StaffRole, StaffUser, StudentUser } from '../../src/access/roles'
import { notifyFamily, receivedMessage, statusMessage } from '../../src/lib/application-notify'
import type { Notifier } from '../../src/lib/notify'

const staff = (role: StaffRole) => ({ id: 1, collection: 'users', role, active: true }) as unknown as StaffUser
const student = { id: 7, collection: 'students' } as unknown as StudentUser

describe('canChangeApplicationStatus', () => {
  const officer = staff('admissions')

  it('lets the officer take the normal steps', () => {
    expect(canChangeApplicationStatus(officer, 'submitted', 'review')).toBe(true)
    expect(canChangeApplicationStatus(officer, 'review', 'interview')).toBe(true)
    expect(canChangeApplicationStatus(officer, 'interview', 'admitted')).toBe(true)
    expect(canChangeApplicationStatus(officer, 'waitlisted', 'admitted')).toBe(true)
  })

  it('does not let the officer skip the review or reverse a decision', () => {
    expect(canChangeApplicationStatus(officer, 'submitted', 'admitted')).toBe(false)
    expect(canChangeApplicationStatus(officer, 'admitted', 'rejected')).toBe(false)
    expect(canChangeApplicationStatus(officer, 'rejected', 'review')).toBe(false)
  })

  it('lets the super admin correct a decision', () => {
    expect(canChangeApplicationStatus(staff('superAdmin'), 'rejected', 'review')).toBe(true)
  })

  it('lets nobody outside the admissions team change anything', () => {
    for (const user of [staff('editor'), staff('registrar'), staff('bursar'), student, null]) {
      expect(canChangeApplicationStatus(user, 'submitted', 'review')).toBe(false)
    }
  })
})

describe('family messages', () => {
  const site = 'https://example.test'

  it('carry the reference, the stage and the tracking link', () => {
    const message = statusMessage('AHSN-7Q4K2P', 'interview', site)
    expect(message.subject).toBe('Application AHSN-7Q4K2P: Interview or entrance test')
    expect(message.text).toContain('https://example.test/admissions/track')
    expect(message.sms).toContain('AHSN-7Q4K2P')
  })

  it('keep the SMS to two segments at most', () => {
    for (const status of ['submitted', 'review', 'interview', 'admitted', 'waitlisted', 'rejected']) {
      expect(statusMessage('AHSN-7Q4K2P', status, site).sms.length).toBeLessThanOrEqual(306)
    }
    expect(receivedMessage('AHSN-7Q4K2P', site).sms.length).toBeLessThanOrEqual(306)
  })
})

describe('notifyFamily', () => {
  function fakeNotifier() {
    return { sendEmail: vi.fn(async () => {}), sendSms: vi.fn(async () => {}) } satisfies Notifier
  }
  const message = statusMessage('AHSN-7Q4K2P', 'review', 'https://example.test')

  it('emails a family that gave an address, and sends no SMS while SMS is off', async () => {
    const notifier = fakeNotifier()
    await notifyFamily(notifier, { guardianEmail: 'parent@example.test', guardianPhone: '0772123456' }, message, {
      sms: false,
    })
    expect(notifier.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'parent@example.test' }))
    expect(notifier.sendSms).not.toHaveBeenCalled()
  })

  it('sends an SMS when SMS is on, and no email when none was given', async () => {
    const notifier = fakeNotifier()
    await notifyFamily(notifier, { guardianEmail: null, guardianPhone: '0772123456' }, message, { sms: true })
    expect(notifier.sendSms).toHaveBeenCalledWith({ to: '0772123456', text: message.sms })
    expect(notifier.sendEmail).not.toHaveBeenCalled()
  })
})
