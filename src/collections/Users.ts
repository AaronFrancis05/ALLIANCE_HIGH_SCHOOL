/**
 * Staff accounts (FR-05, FR-11).
 *
 * Students are a separate collection on purpose, so a student session can never satisfy
 * a staff check and vice versa.
 */

import type { CollectionConfig } from 'payload'
import { ROLE_LABELS, STAFF_ROLES, fieldSuperAdminOnly, hasRole, superAdminOnly } from '../access/roles'
import type { StaffUser } from '../access/roles'
import { recordAudit } from '../lib/audit'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Staff account', plural: 'Staff accounts' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'department', 'active'],
    group: 'People',
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
  fields: [
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
      name: 'twoFactor',
      type: 'group',
      label: 'Two-factor authentication',
      admin: { position: 'sidebar' },
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
    afterLogin: [
      async ({ req, user }) => {
        await recordAudit(req, {
          action: 'staff.login',
          targetType: 'users',
          targetId: String(user.id),
        })
      },
    ],
    afterChange: [
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
