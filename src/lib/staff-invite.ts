/**
 * Staff invitations (FR-05, A07).
 *
 * The super admin adds a staff member with a name, email address and role, but never a
 * password. The new account gets a long random password nobody knows, and the staff member
 * is emailed a link to choose their own. The link is Payload's password-reset token, issued
 * with a longer life (three days) because people do not always read work email at once.
 * It opens the admin's own "set a new password" screen, which signs them straight in.
 *
 * Sending again issues a fresh token, which replaces the previous one.
 */

import crypto from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'
import { ROLE_LABELS, type StaffRole } from '../access/roles'
import { env } from './env'

/** How long an invitation link works. */
export const INVITE_LIFETIME_MS = 72 * 60 * 60 * 1000

const SCHOOL = 'Alliance High School Nansana'

/**
 * A password nobody knows, so the account cannot be used until its owner sets their own.
 * Shared with student accounts, which are created the same way.
 */
export function unusablePassword(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export function inviteLink(token: string, siteUrl = env.siteUrl): string {
  return `${siteUrl}/admin/reset/${encodeURIComponent(token)}`
}

export interface InviteMessage {
  subject: string
  text: string
}

export function inviteMessage(input: { name: string; role: StaffRole; link: string }): InviteMessage {
  return {
    subject: `You have been invited to the ${SCHOOL} website`,
    text: [
      `Hello ${input.name},`,
      '',
      `You have been given a staff account on the ${SCHOOL} website, as ${ROLE_LABELS[input.role]}.`,
      '',
      'Choose your password here to finish setting it up:',
      input.link,
      '',
      'The link works once and expires in three days. If it has expired, ask the ICT office to',
      'send a new one. Nobody from the school will ever ask you for your password.',
      '',
      `After that, sign in at ${env.siteUrl}/admin with this email address.`,
    ].join('\n'),
  }
}

/**
 * Issues a fresh invitation token for an existing staff account and emails the link.
 * Pass the request when called from a hook, so the token is written in the same transaction.
 */
export async function sendStaffInvite(
  payload: Payload,
  account: { email: string; name: string; role: StaffRole },
  req?: PayloadRequest,
): Promise<void> {
  const token = await payload.forgotPassword({
    collection: 'users',
    data: { email: account.email },
    disableEmail: true,
    expiration: INVITE_LIFETIME_MS,
    req,
  })

  if (!token) throw new Error('No invitation token was issued')

  const message = inviteMessage({ name: account.name, role: account.role, link: inviteLink(token) })
  // Sent directly rather than through the notifier, which swallows failures: the super
  // admin needs to know when an invitation did not go.
  await payload.sendEmail({ to: account.email, subject: message.subject, text: message.text })
}
