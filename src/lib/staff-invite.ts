/**
 * Staff invitations (FR-05, A07).
 *
 * The super admin adds a staff member with a name, email address and roles, but never a
 * password. The new account gets a long random password nobody knows, and the staff member
 * is emailed a link to choose their own. The link is Payload's password-reset token, issued
 * with a longer life (three days) because people do not always read work email at once.
 * Staff open the staff portal's "choose your password" page; a super admin opens the
 * admin's own reset screen, because that is the only door they sign in at.
 *
 * Sending again issues a fresh token, which replaces the previous one.
 */

import crypto from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'
import { ROLE_LABELS, type AccountType, type StaffRole } from '../access/roles'
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

/** Where an account signs in: the super admin at /admin, everyone else at /staff. */
export function signInPath(accountType: AccountType | null | undefined): string {
  return accountType === 'superAdmin' ? '/admin' : '/staff'
}

export function inviteLink(token: string, accountType: AccountType | null | undefined, siteUrl = env.siteUrl): string {
  return `${siteUrl}${signInPath(accountType)}/reset/${encodeURIComponent(token)}`
}

/** "as Super Admin (ICT)", "as staff" or "as staff (Bursar, Teacher)". */
function accessPhrase(accountType: AccountType | null | undefined, roles: readonly StaffRole[]): string {
  if (accountType === 'superAdmin') return 'as Super Admin (ICT)'
  if (!roles.length) return 'as staff'
  return `as staff (${roles.map((role) => ROLE_LABELS[role]).join(', ')})`
}

/** The "forgot your password" email, linking to the account's own door. */
export const resetEmail = {
  subject: `Choose a new password for the ${SCHOOL} website`,
  html(token: string, accountType: AccountType | null | undefined, siteUrl = env.siteUrl): string {
    const link = inviteLink(token, accountType, siteUrl)
    return [
      '<p>Someone asked to reset the password for this staff account.</p>',
      `<p><a href="${link}">Choose a new password</a> (the link works for one hour).</p>`,
      '<p>If it was not you, ignore this email: your password stays as it is.</p>',
    ].join('\n')
  },
}

export interface InviteMessage {
  subject: string
  text: string
}

export interface InviteAccount {
  email: string
  name: string
  accountType?: AccountType | null
  roles?: StaffRole[] | null
}

export function inviteMessage(input: {
  name: string
  accountType?: AccountType | null
  roles?: readonly StaffRole[] | null
  link: string
}): InviteMessage {
  return {
    subject: `You have been invited to the ${SCHOOL} website`,
    text: [
      `Hello ${input.name},`,
      '',
      `You have been given an account on the ${SCHOOL} website, ${accessPhrase(input.accountType, input.roles ?? [])}.`,
      '',
      'Choose your password here to finish setting it up:',
      input.link,
      '',
      'The link works once and expires in three days. If it has expired, ask the ICT office to',
      'send a new one. Nobody from the school will ever ask you for your password.',
      '',
      `After that, sign in at ${env.siteUrl}${signInPath(input.accountType)} with this email address.`,
    ].join('\n'),
  }
}

/**
 * Issues a fresh invitation token for an existing staff account and emails the link.
 * Pass the request when called from a hook, so the token is written in the same transaction.
 */
export async function sendStaffInvite(
  payload: Payload,
  account: InviteAccount,
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

  const message = inviteMessage({
    name: account.name,
    accountType: account.accountType,
    roles: account.roles,
    link: inviteLink(token, account.accountType),
  })
  // Sent directly rather than through the notifier, which swallows failures: the super
  // admin needs to know when an invitation did not go.
  await payload.sendEmail({ to: account.email, subject: message.subject, text: message.text })
}
