/**
 * Staff accounts (FR-05, FR-11).
 *
 * Students are a separate collection on purpose, so a student session can never satisfy
 * a staff check and vice versa.
 *
 * Only the super admin adds staff, and never types a password for them: a new account is
 * given a password nobody knows and its owner is emailed an invitation to choose their own
 * (see staff-invite.ts). The super admin can send the invitation again from the account.
 */

import type { CollectionConfig, PayloadHandler } from 'payload'
import {
  ROLE_LABELS,
  STAFF_ROLES,
  canInviteStaff,
  fieldSuperAdminOnly,
  hasRole,
  hiddenUnless,
  ownPasswordOnly,
  passwordNeverOnCreate,
  superAdminOnly,
} from '../access/roles'
import type { StaffRole, StaffUser } from '../access/roles'
import { recordAudit } from '../lib/audit'
import { logger } from '../lib/logger'
import { sendStaffInvite, unusablePassword } from '../lib/staff-invite'

/** Set on the request when an account is created without a password, so it is invited. */
const SEND_INVITE = 'sendStaffInvite'

/** POST /api/users/:id/invite: sends the invitation again (super admin only). */
const resendInvite: PayloadHandler = async (req) => {
  if (!canInviteStaff(req.user)) {
    return Response.json({ error: 'Only the super admin can send invitations.' }, { status: 403 })
  }

  const id = req.routeParams?.id
  const account = await req.payload
    .findByID({ collection: 'users', id: String(id), depth: 0, req })
    .catch(() => null)
  if (!account) return Response.json({ error: 'That staff account was not found.' }, { status: 404 })

  try {
    await sendStaffInvite(req.payload, { email: account.email, name: account.name, role: account.role as StaffRole })
  } catch (error) {
    logger.error('Staff invitation could not be sent', { error })
    return Response.json({ error: 'The invitation email could not be sent. Please try again.' }, { status: 502 })
  }

  await req.payload.update({
    collection: 'users',
    id: account.id,
    data: { invitedAt: new Date().toISOString() },
    overrideAccess: true,
    req,
  })
  await recordAudit(req, { action: 'staff.invited', targetType: 'users', targetId: String(account.id), detail: 'sent again' })

  return Response.json({ ok: true })
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Staff account', plural: 'Staff accounts' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'department', 'firstSignedInAt', 'active'],
    group: 'People',
    description:
      'Add a staff member with their email address and role. They are emailed an invitation to choose their own password.',
    // Everyone else reaches their own account from the avatar menu.
    hidden: hiddenUnless('superAdmin'),
  },
  auth: {
    // Lock the account after repeated failures (A07).
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 30 * 60, // 30 minutes for staff
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    // Only the super admin manages staff accounts; everyone else may read the directory.
    create: superAdminOnly,
    delete: superAdminOnly,
    update: ({ req, id }) => {
      if (hasRole(req.user as StaffUser, 'superAdmin')) return true
      // Anyone may edit their own profile, but not their own role (see field access below).
      return req.user?.collection === 'users' && String(req.user.id) === String(id)
    },
    read: ({ req }) => req.user?.collection === 'users',
    admin: ({ req }) => req.user?.collection === 'users',
  },
  endpoints: [{ path: '/:id/invite', method: 'post', handler: resendInvite }],
  fields: [
    {
      // Payload adds the password itself; declaring it here only sets who may type one.
      // Nobody types one when adding staff, and each person may change only their own.
      name: 'password',
      type: 'text',
      virtual: true,
      // Never rendered (Payload draws its own password boxes). Not `hidden: true`, which
      // would drop it from the permissions that decide who sees "Change password".
      admin: { disabled: true },
      access: { create: passwordNeverOnCreate, update: ownPasswordOnly },
    },
    {
      // Hides the password boxes on a new account and fills the form's hidden fields.
      name: 'accountFormHelper',
      type: 'ui',
      admin: { components: { Field: '/components/admin/AccountFormHelper#AccountFormHelper' } },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Full name as it should appear in the staff directory.' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'teacher',
      options: STAFF_ROLES.map((role) => ({ label: ROLE_LABELS[role], value: role })),
      access: {
        // Nobody can promote themselves.
        create: fieldSuperAdminOnly,
        update: fieldSuperAdminOnly,
      },
      admin: { description: 'Decides what this person can see and change.' },
    },
    {
      name: 'department',
      type: 'relationship',
      relationTo: 'departments',
      admin: {
        description: 'Required for Heads of Department: they may only manage their own department.',
        condition: (data) => data?.role === 'hod' || data?.role === 'teacher',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      access: { update: fieldSuperAdminOnly },
      admin: {
        position: 'sidebar',
        description: 'Unchecked accounts keep their history but cannot sign in.',
      },
    },
    {
      name: 'invitation',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/admin/InvitationStatus#InvitationStatus' },
      },
    },
    {
      name: 'invitedAt',
      type: 'date',
      access: { create: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: 'firstSignedInAt',
      type: 'date',
      label: 'First signed in',
      access: { create: () => false, update: () => false },
      // Shown as a list column; on the account itself the invitation panel says it in words.
      admin: { readOnly: true, condition: () => false, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'twoFactor',
      type: 'group',
      label: 'Two-factor authentication',
      // Not built yet (P6, STAFF_2FA_REQUIRED). Hidden until it does something.
      admin: { position: 'sidebar', condition: () => false },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          admin: { readOnly: true, description: 'Set up from the staff profile page.' },
        },
        {
          name: 'secret',
          type: 'text',
          admin: { hidden: true },
          access: {
            // The shared secret is never returned to a browser.
            read: () => false,
            create: () => false,
            update: () => false,
          },
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (operation !== 'create') return data
        // Runs after field access has removed any password typed for someone else, so only
        // a trusted server call (the seed) gets here with one. Otherwise the account gets a
        // password nobody knows, and its owner is invited to choose their own.
        if (!data?.password) {
          req.context[SEND_INVITE] = true
          return { ...data, password: unusablePassword() }
        }
        return data
      },
    ],
    afterLogin: [
      async ({ req, user }) => {
        if (!user.firstSignedInAt) {
          await req.payload.update({
            collection: 'users',
            id: user.id,
            data: { firstSignedInAt: new Date().toISOString() },
            overrideAccess: true,
            req,
          })
        }
        await recordAudit(req, {
          action: 'staff.login',
          targetType: 'users',
          targetId: String(user.id),
        })
      },
    ],
    afterChange: [
      async ({ req, doc, operation }) => {
        if (operation !== 'create' || !req.context[SEND_INVITE]) return
        req.context[SEND_INVITE] = false
        try {
          await sendStaffInvite(req.payload, { email: doc.email, name: doc.name, role: doc.role }, req)
          await req.payload.update({
            collection: 'users',
            id: doc.id,
            data: { invitedAt: new Date().toISOString() },
            overrideAccess: true,
            req,
          })
          await recordAudit(req, { action: 'staff.invited', targetType: 'users', targetId: String(doc.id) })
        } catch (error) {
          // The account is still created; the super admin can send the invitation again.
          logger.error('Staff invitation could not be sent', { error })
        }
      },
      async ({ req, doc, previousDoc, operation }) => {
        if (operation === 'update' && previousDoc?.role !== doc.role) {
          await recordAudit(req, {
            action: 'staff.role-changed',
            targetType: 'users',
            targetId: String(doc.id),
            detail: `${previousDoc?.role ?? 'none'} to ${doc.role}`,
          })
        }
      },
    ],
  },
}
