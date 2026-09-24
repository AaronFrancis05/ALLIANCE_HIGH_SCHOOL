/**
 * Student accounts (FR-10).
 *
 * A separate auth collection from staff, so the two sessions can never be confused.
 * Students sign in with their admission number, not an email address, because most do
 * not have a school email.
 */

import type { CollectionConfig } from 'payload'
import { hasRole, isStudent, roles, type StaffUser, type StudentUser } from '../access/roles'
import { CLASS_LABELS, SCHOOL_CLASSES } from '../access/resources'
import { recordAudit } from '../lib/audit'

export const Students: CollectionConfig = {
  slug: 'students',
  labels: { singular: 'Student', plural: 'Students' },
  admin: {
    useAsTitle: 'admissionNo',
    defaultColumns: ['admissionNo', 'fullName', 'class', 'stream', 'status'],
    group: 'People',
    description: 'Student records and portal sign-in details.',
  },
  auth: {
    // Sign-in is by admission number; Payload still needs a unique login field.
    loginWithUsername: {
      allowEmailLogin: false,
      requireEmail: false,
    },
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 2 * 60 * 60, // 2 hours: students are often on slow connections
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    create: roles('superAdmin', 'registrar'),
    delete: roles('superAdmin'),
    update: ({ req, id }) => {
      if (hasRole(req.user as StaffUser, 'registrar')) return true
      // A student may only touch their own record (and only some fields, see below).
      if (isStudent(req.user as StudentUser)) return String(req.user!.id) === String(id)
      return false
    },
    read: ({ req }) => {
      if (hasRole(req.user as StaffUser, 'registrar', 'bursar', 'admissions', 'teacher', 'hod')) return true
      if (isStudent(req.user as StudentUser)) return { id: { equals: req.user!.id } }
      return false
    },
    admin: ({ req }) => req.user?.collection === 'users',
  },
  fields: [
    {
      name: 'admissionNo',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'For example AHSN/25/030. This is also the portal username.' },
    },
    { name: 'regNo', type: 'text', admin: { description: 'UNEB registration number, when issued.' } },
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    {
      name: 'fullName',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
      hooks: {
        beforeChange: [({ data }) => [data?.firstName, data?.lastName].filter(Boolean).join(' ')],
      },
    },
    {
      name: 'class',
      type: 'select',
      required: true,
      index: true,
      options: SCHOOL_CLASSES.map((value) => ({ label: CLASS_LABELS[value], value })),
    },
    { name: 'stream', type: 'text', admin: { description: 'For example East, West.' } },
    { name: 'house', type: 'text' },
    {
      name: 'residence',
      type: 'select',
      defaultValue: 'boarding',
      options: [
        { label: 'Boarding', value: 'boarding' },
        { label: 'Day', value: 'day' },
      ],
    },
    {
      name: 'guardians',
      type: 'array',
      labels: { singular: 'Guardian', plural: 'Guardians' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'relationship', type: 'text' },
        { name: 'phone', type: 'text', required: true },
        { name: 'email', type: 'email' },
      ],
    },
    {
      name: 'phone',
      type: 'text',
      admin: { description: 'Used for password reset codes. The guardian’s number is fine.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Alumnus', value: 'alumni' },
      ],
      access: { update: ({ req }) => hasRole(req.user as StaffUser, 'registrar') },
    },
    {
      name: 'mustChangePassword',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Forces a new password at the next sign-in (FR-10).',
      },
    },
  ],
  hooks: {
    afterLogin: [
      async ({ req, user }) => {
        await recordAudit(req, {
          action: 'student.login',
          targetType: 'students',
          targetId: String(user.id),
        })
      },
    ],
  },
}
