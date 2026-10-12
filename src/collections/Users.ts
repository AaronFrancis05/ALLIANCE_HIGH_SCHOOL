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

import { APIError, type CollectionConfig, type PayloadHandler } from 'payload'
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  canInviteStaff,
  canUseAdminScreens,
  deleteOtherStaff,
  fieldSuperAdminOnly,
  fieldSuperAdminOnOthers,
  hiddenUnlessSuperAdmin,
  isSuperAdmin,
  mayUseAdminSignIn,
  ownPasswordOnly,
  passwordNeverOnCreate,
  ROLE_LABELS,
  STAFF_ROLES,
  superAdminOnly,
} from '../access/roles'
import type { StaffUser } from '../access/roles'
import { recordAudit } from '../lib/audit'
import { booleanCell } from '../fields/boolean-cell'
import { logger } from '../lib/logger'
import { STAFF_PORTAL_SIGN_IN, SWITCHED_OFF, WRONG_DOOR } from '../lib/staff-doors'
import { resetEmail, sendStaffInvite, unusablePassword } from '../lib/staff-invite'

/** Set on the request when an account is created without a password, so it is invited. */
const SEND_INVITE = 'sendStaffInvite'


/** For the form's show/hide conditions, which see the unsaved form data. */
function hasAnyRole(data: { roles?: unknown } | undefined, ...wanted: string[]): boolean {
  return Array.isArray(data?.roles) && data.roles.some((role) => wanted.includes(String(role)))
}

/** How an account's access reads in the audit log, e.g. "staff: bursar, teacher". */
function describeAccess(doc: { accountType?: string | null; roles?: string[] | null } | undefined): string {
  if (!doc) return 'none'
  if (doc.accountType === 'superAdmin') return 'super admin'
  const roles = [...(doc.roles ?? [])].sort()
  return roles.length ? `staff: ${roles.join(', ')}` : 'staff'
}

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
    await sendStaffInvite(req.payload, account)
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
    defaultColumns: ['name', 'email', 'accountType', 'roles', 'department', 'firstSignedInAt', 'active'],
    group: 'People',
    description:
      'Add a staff member with their email address and any roles. They are emailed an invitation to choose their own password and sign in at /staff.',
    // Everyone else reaches their own account from the avatar menu.
    hidden: hiddenUnlessSuperAdmin,
  },
  auth: {
    // Lock the account after repeated failures (A07).
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 30 * 60, // 30 minutes for staff
    forgotPassword: {
      // Staff choose a new password in the staff portal, the super admin in the admin.
      generateEmailSubject: () => resetEmail.subject,
      generateEmailHTML: (args) => resetEmail.html(args?.token ?? '', (args?.user as StaffUser | undefined)?.accountType),
    },
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    // Only the super admin manages staff accounts; everyone else may read the directory.
    create: superAdminOnly,
    // Never their own account, so the school is never left without a super admin.
    delete: deleteOtherStaff,
    update: ({ req, id }) => {
      if (isSuperAdmin(req.user as StaffUser)) return true
      // Anyone may edit their own profile, but not their own role (see field access below).
      return req.user?.collection === 'users' && String(req.user.id) === String(id)
    },
    read: ({ req }) => req.user?.collection === 'users',
    // The super admin, and staff with at least one role. Staff with none use /staff only.
    admin: ({ req }) => canUseAdminScreens(req.user),
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
      name: 'accountType',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      options: ACCOUNT_TYPES.map((type) => ({ label: ACCOUNT_TYPE_LABELS[type], value: type })),
      access: {
        // Nobody changes their own, so the school is never left without a super admin.
        create: fieldSuperAdminOnly,
        update: fieldSuperAdminOnOthers,
      },
      admin: {
        position: 'sidebar',
        description: 'The super admin reaches everything and signs in at /admin. Staff sign in at /staff.',
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: [],
      options: STAFF_ROLES.map((role) => ({ label: ROLE_LABELS[role], value: role })),
      access: {
        // Nobody changes their own roles; the super admin grants them.
        create: fieldSuperAdminOnly,
        update: fieldSuperAdminOnOthers,
      },
      admin: {
        description:
          'What this person works on, on top of staff access. Choose as many as apply. Without a role they can still use the staff portal.',
        condition: (data) => data?.accountType !== 'superAdmin',
      },
    },
    {
      name: 'department',
      type: 'relationship',
      relationTo: 'departments',
      // The department decides which shelf a head of department manages, so nobody may
      // change their own: anyone may edit their own profile, but not this.
      access: { create: fieldSuperAdminOnly, update: fieldSuperAdminOnly },
      admin: {
        description: 'Required for Heads of Department: they may only manage their own department.',
        condition: (data) => hasAnyRole(data, 'hod', 'teacher'),
      },
    },
    {
      name: 'subjects',
      type: 'relationship',
      relationTo: 'subjects',
      hasMany: true,
      // Decides which subjects' holiday work a teacher may upload, so only the super admin sets it.
      access: { create: fieldSuperAdminOnly, update: fieldSuperAdminOnly },
      admin: {
        description: 'The subjects this teacher teaches. They may upload holiday work for these subjects only.',
        condition: (data) => hasAnyRole(data, 'teacher'),
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      access: { update: fieldSuperAdminOnOthers },
      admin: {
        position: 'sidebar',
        components: { Cell: booleanCell('Active', 'Deactivated') },
        description: 'Unchecked accounts keep their history but cannot sign in. Nobody can deactivate their own account.',
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
    beforeLogin: [
      ({ req, user }) => {
        // Checked after the password is accepted, so it tells nobody whether an email exists.
        if ((user as StaffUser).active === false) {
          throw new APIError(SWITCHED_OFF, 403, undefined, true)
        }
        // Two doors: the super admin signs in at /admin, everyone else at /staff.
        const superAdmin = mayUseAdminSignIn({ ...user, collection: 'users' })
        const viaStaffPortal = Boolean(req.context[STAFF_PORTAL_SIGN_IN])
        if (superAdmin && viaStaffPortal) {
          throw new APIError(WRONG_DOOR.superAdmin, 403, undefined, true)
        }
        if (!superAdmin && !viaStaffPortal) {
          throw new APIError(WRONG_DOOR.staff, 403, undefined, true)
        }
        return user
      },
    ],
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
        // Inside the login's own transaction: staff portal sign-in already holds one
        // connection for the per-account lock, and production's pool is small.
        await recordAudit(
          req,
          { action: 'staff.login', targetType: 'users', targetId: String(user.id) },
          { inTransaction: true },
        )
      },
    ],
    afterChange: [
      async ({ req, doc, operation }) => {
        if (operation !== 'create' || !req.context[SEND_INVITE]) return
        req.context[SEND_INVITE] = false
        try {
          await sendStaffInvite(req.payload, doc, req)
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
        const before = describeAccess(previousDoc)
        const after = describeAccess(doc)
        if (operation === 'update' && before !== after) {
          await recordAudit(req, {
            action: 'staff.role-changed',
            targetType: 'users',
            targetId: String(doc.id),
            detail: `${before} to ${after}`,
          })
        }
      },
    ],
  },
}
