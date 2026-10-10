/**
 * Student accounts (FR-10).
 *
 * A separate auth collection from staff, so the two sessions can never be confused.
 * Students sign in with their admission number, not an email address, because most do
 * not have a school email.
 *
 * The registrar creates each record from the details the school holds, with the admission
 * number in the school's own format. Nobody types a student's password: the record gets one
 * nobody knows, and the student sets their own through first-time sign-in, with a code
 * emailed to the addresses on the record (see student-setup.ts).
 */

import type { CollectionConfig } from 'payload'
import { hasRole, hiddenUnless, passwordNeverOnCreate, roles, type StaffUser } from '../access/roles'
import { CLASS_LABELS, SCHOOL_CLASSES } from '../access/resources'
import {
  STUDENT_RECORD_KEEPERS,
  fieldStudentRecordKeepers,
  manageStudents,
  readStudents,
} from '../access/students'
import { recordAudit } from '../lib/audit'
import { unusablePassword } from '../lib/staff-invite'

/** Hidden, system-only fields: nobody reads or writes them through the API. */
const systemOnly = { read: () => false, create: () => false, update: () => false }

export const Students: CollectionConfig = {
  slug: 'students',
  labels: { singular: 'Student', plural: 'Students' },
  admin: {
    useAsTitle: 'admissionNo',
    defaultColumns: ['admissionNo', 'fullName', 'class', 'stream', 'status', 'portalSetUp'],
    group: 'People',
    description:
      'Student records. Each student sets their own portal password the first time they sign in, with a code emailed to the addresses below.',
    hidden: hiddenUnless(...STUDENT_RECORD_KEEPERS),
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
    create: manageStudents,
    delete: roles('superAdmin'),
    update: manageStudents,
    read: readStudents,
    admin: ({ req }) => req.user?.collection === 'users',
  },
  fields: [
    {
      // Payload adds the password itself; declaring it here means nobody can type one.
      // The student sets it through first-time sign-in, which writes it on the server.
      name: 'password',
      type: 'text',
      virtual: true,
      // Never rendered (Payload draws its own password boxes). Not `hidden: true`, which
      // would drop it from the permissions that decide who sees "Change password".
      admin: { disabled: true },
      access: { create: passwordNeverOnCreate, update: passwordNeverOnCreate },
    },
    {
      // Kept equal to the admission number by the hook below; never typed separately.
      name: 'username',
      type: 'text',
      admin: { hidden: true },
    },
    {
      // Hides the password boxes on a new account and fills the form's hidden fields.
      name: 'accountFormHelper',
      type: 'ui',
      admin: { components: { Field: '/components/admin/AccountFormHelper#AccountFormHelper' } },
    },
    {
      name: 'admissionNo',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { update: fieldStudentRecordKeepers },
      admin: {
        description:
          'Exactly as the school issues it, in its own format (for example AHSN/25/030). The student signs in with it.',
      },
    },
    {
      name: 'email',
      type: 'email',
      label: 'Student email',
      admin: {
        description:
          'Optional. The first-time sign-in code goes here and to every guardian email below.',
      },
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
      name: 'portalSetUp',
      type: 'checkbox',
      label: 'Portal set up',
      defaultValue: false,
      access: { create: () => false, update: fieldStudentRecordKeepers },
      admin: {
        position: 'sidebar',
        description:
          'Ticked once the student has chosen a password. Untick it if they have forgotten it: the old password stops working and they set a new one through first-time sign-in.',
      },
    },
    // The current first-time sign-in code, as a keyed hash. System only.
    { name: 'setupCodeHash', type: 'text', hidden: true, access: systemOnly },
    { name: 'setupCodeExpiresAt', type: 'date', hidden: true, access: systemOnly },
    { name: 'setupCodeAttempts', type: 'number', hidden: true, access: systemOnly },
    { name: 'setupCodeSentAt', type: 'date', hidden: true, access: systemOnly },
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (!data) return data
        const next = { ...data }
        // The admission number is the sign-in name, whatever format the school uses.
        if (typeof next.admissionNo === 'string') {
          next.admissionNo = next.admissionNo.trim()
          next.username = next.admissionNo
        }
        // Runs after field access has removed any typed password, so only a trusted
        // server call (the seed, first-time sign-in) gets here with one.
        if (operation === 'create' && !next.password) next.password = unusablePassword()
        return next
      },
    ],
    afterChange: [
      async ({ req, doc, previousDoc, operation }) => {
        if (operation !== 'update' || !previousDoc?.portalSetUp || doc.portalSetUp) return
        // The registrar unticked "Portal set up": the old password and every signed-in
        // device stop working, and the student starts again with first-time sign-in.
        await req.payload.db.updateOne({
          collection: 'students',
          id: doc.id,
          data: { sessions: [] },
          req,
        })
        await req.payload.update({
          collection: 'students',
          id: doc.id,
          data: { password: unusablePassword() },
          overrideAccess: true,
          req,
        })
        await recordAudit(req, {
          action: 'student.portal-reset',
          targetType: 'students',
          targetId: String(doc.id),
        })
      },
    ],
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
