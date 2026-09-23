/**
 * Telling a family about their application (FR-19).
 *
 * Messages name the application by its reference and say what stage it has reached. They
 * never include the child's name: a mistyped phone number or email address would otherwise
 * send a child's details to a stranger.
 *
 * Email goes whenever the family gave an address. SMS goes only when NOTIFY_SMS_ENABLED is
 * on, because each message costs the school money.
 */

import { env } from './env'
import { statusForFamily } from './application-status'
import type { Notifier } from './notify'

export interface FamilyMessage {
  subject: string
  text: string
  /** Short enough for one or two SMS segments. */
  sms: string
}

const SCHOOL = 'Alliance High School Nansana'

function trackUrl(siteUrl: string): string {
  return `${siteUrl}/admissions/track`
}

/** Sent once, when the application arrives. */
export function receivedMessage(trackingCode: string, siteUrl = env.siteUrl): FamilyMessage {
  return {
    subject: `Application received: ${trackingCode}`,
    text: [
      `Thank you for applying to ${SCHOOL}.`,
      '',
      `Your application reference is ${trackingCode}. Keep it: you need it, with the telephone`,
      'number you gave on the form, to check progress, and the admissions office will ask for it.',
      '',
      `Check progress at any time: ${trackUrl(siteUrl)}`,
      '',
      'You will get a message like this each time the application moves to a new stage.',
    ].join('\n'),
    sms: `${SCHOOL}: application ${trackingCode} received. Track it at ${trackUrl(siteUrl)}`,
  }
}

/** Sent each time the admissions office moves the application to a new stage. */
export function statusMessage(trackingCode: string, status: string, siteUrl = env.siteUrl): FamilyMessage {
  const stage = statusForFamily(status)
  return {
    subject: `Application ${trackingCode}: ${stage.title}`,
    text: [
      `Your application to ${SCHOOL}, reference ${trackingCode}, has a new status:`,
      '',
      stage.title,
      stage.explanation,
      '',
      `Check progress at any time: ${trackUrl(siteUrl)}`,
    ].join('\n'),
    sms: `${SCHOOL}: application ${trackingCode} - ${stage.title}. Details: ${trackUrl(siteUrl)}`,
  }
}

export interface FamilyContact {
  guardianEmail?: string | null
  guardianPhone: string
}

export async function notifyFamily(
  notifier: Notifier,
  contact: FamilyContact,
  message: FamilyMessage,
  options: { sms?: boolean } = {},
): Promise<void> {
  const sendSms = options.sms ?? env.sms.familyNotifications
  const sends: Promise<void>[] = []
  if (contact.guardianEmail) {
    sends.push(notifier.sendEmail({ to: contact.guardianEmail, subject: message.subject, text: message.text }))
  }
  if (sendSms) sends.push(notifier.sendSms({ to: contact.guardianPhone, text: message.sms }))
  // The notifier logs and swallows its own failures, so one channel cannot stop the other.
  await Promise.all(sends)
}
