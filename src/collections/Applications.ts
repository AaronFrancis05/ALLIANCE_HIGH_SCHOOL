/**
 * Online admissions (FR-16, FR-18, FR-19).
 *
 * No payment is taken: the school collects the application fee in the usual way. The
 * tracking code plus the guardian's phone number is what lets an applicant check
 * progress, and that lookup is rate-limited.
 *
 * Applications hold a child's personal data, so only the admissions team can read them,
 * and rejected applications are deleted after twelve months by the retention job.
 */

import type { CollectionConfig } from 'payload'
import { denyAll, hasRole, roles, type StaffUser } from '../access/roles'
import { readAdmissions } from '../access/admissions'
import { recordAudit } from '../lib/audit'

export const APPLICATION_STATUSES = [
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under review', value: 'review' },
  { label: 'Interview or entrance test', value: 'interview' },
  { label: 'Admitted', value: 'admitted' },
  { label: 'Waitlisted', value: 'waitlisted' },
  { label: 'Not successful', value: 'rejected' },
] as const

export const Applications: CollectionConfig = {
  slug: 'applications',
  labels: { singular: 'Application', plural: 'Admissions' },
  admin: {
    useAsTitle: 'trackingCode',
    defaultColumns: ['trackingCode', 'applicantName', 'applicantType', 'classSought', 'status', 'createdAt'],
    group: 'Admissions',
    description: 'Applications submitted through the website.',
  },
  access: {
    // Applications are created by the public form through a server route, never directly.
    create: denyAll,
    read: readAdmissions,
    update: readAdmissions,
    delete: roles('superAdmin'),
  },
  fields: [
    {
      name: 'trackingCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'submitted',
      options: [...APPLICATION_STATUSES],
      index: true,
      admin: { position: 'sidebar', description: 'The applicant is notified on every change.' },
    },
    {
      name: 'applicantType',
      type: 'select',
      required: true,
      defaultValue: 's1',
      options: [
        { label: 'Senior One (from primary school)', value: 's1' },
        { label: 'Senior Five (after UCE)', value: 's5' },
        { label: 'Transfer or continuing student', value: 'transfer' },
      ],
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      type: 'collapsible',
      label: 'Student',
      fields: [
        { name: 'applicantName', type: 'text', required: true },
        {
          type: 'row',
          fields: [
            { name: 'dateOfBirth', type: 'date', required: true, admin: { width: '50%' } },
            {
              name: 'gender',
              type: 'select',
              required: true,
              options: [
                { label: 'Female', value: 'female' },
                { label: 'Male', value: 'male' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'classSought',
              type: 'select',
              required: true,
              options: [
                { label: 'Senior One', value: 'S1' },
                { label: 'Senior Two', value: 'S2' },
                { label: 'Senior Three', value: 'S3' },
                { label: 'Senior Four', value: 'S4' },
                { label: 'Senior Five', value: 'S5' },
                { label: 'Senior Six', value: 'S6' },
              ],
              admin: { width: '50%' },
            },
            {
              name: 'residence',
              type: 'select',
              required: true,
              defaultValue: 'boarding',
              options: [
                { label: 'Boarding', value: 'boarding' },
                { label: 'Day', value: 'day' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        { name: 'previousSchool', type: 'text', required: true, label: 'Former school' },
      ],
    },
    {
      type: 'collapsible',
      label: 'PLE results (Senior One applicants)',
      admin: { condition: (data) => data?.applicantType === 's1' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'pleIndexNumber', type: 'text', label: 'PLE index number', admin: { width: '50%' } },
            { name: 'pleAggregate', type: 'number', label: 'Total aggregate', min: 4, max: 36, admin: { width: '50%' } },
          ],
        },
        { name: 'pleYear', type: 'number', label: 'Year PLE was sat' },
        {
          name: 'pleGrades',
          type: 'array',
          label: 'Grade per subject',
          admin: { description: 'Mathematics, English, Science and Social Studies.' },
          fields: [
            { name: 'subject', type: 'text', required: true },
            { name: 'grade', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'UCE results (Senior Five applicants)',
      admin: { condition: (data) => data?.applicantType === 's5' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'uceIndexNumber', type: 'text', label: 'UCE index number', admin: { width: '50%' } },
            { name: 'combination', type: 'text', label: 'Combination sought', admin: { width: '50%' } },
          ],
        },
        { name: 'uceYear', type: 'number', label: 'Year UCE was sat' },
        {
          name: 'uceResults',
          type: 'array',
          label: 'Grade per subject',
          fields: [
            { name: 'subject', type: 'text', required: true },
            { name: 'grade', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Transfer details',
      admin: { condition: (data) => data?.applicantType === 'transfer' },
      fields: [
        { name: 'currentClass', type: 'text', label: 'Class currently in' },
        { name: 'reasonForTransfer', type: 'textarea' },
        { name: 'lastReportSummary', type: 'textarea', label: 'Summary of the last report' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Parent or guardian',
      fields: [
        { name: 'guardianName', type: 'text', required: true },
        {
          type: 'row',
          fields: [
            { name: 'guardianPhone', type: 'text', required: true, index: true, admin: { width: '50%' } },
            { name: 'guardianEmail', type: 'email', admin: { width: '50%' } },
          ],
        },
        { name: 'guardianRelationship', type: 'text' },
        { name: 'address', type: 'textarea' },
      ],
    },
    {
      name: 'documents',
      type: 'array',
      labels: { singular: 'Document', plural: 'Documents' },
      admin: { description: 'Birth certificate, result slip and photograph, stored privately.' },
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          options: [
            { label: 'Birth certificate', value: 'birth' },
            { label: 'Result slip', value: 'results' },
            { label: 'Passport photograph', value: 'photo' },
            { label: 'Other', value: 'other' },
          ],
        },
        { name: 'file', type: 'relationship', relationTo: 'applicationDocuments', required: true },
        {
          name: 'open',
          type: 'ui',
          admin: { components: { Field: '/components/admin/OpenDocumentLink#OpenDocumentLink' } },
        },
      ],
    },
    {
      name: 'comment',
      type: 'textarea',
      label: 'Comment from the applicant',
      admin: { readOnly: true },
    },
    {
      name: 'consent',
      type: 'checkbox',
      required: true,
      admin: {
        readOnly: true,
        description: 'The guardian confirmed the details are true and agreed to the privacy notice.',
      },
    },
    {
      name: 'notes',
      type: 'array',
      labels: { singular: 'Note', plural: 'Staff notes' },
      access: { read: ({ req }) => hasRole(req.user as StaffUser, 'admissions') },
      fields: [
        { name: 'note', type: 'textarea', required: true },
        { name: 'by', type: 'relationship', relationTo: 'users' },
        { name: 'at', type: 'date', defaultValue: () => new Date().toISOString() },
      ],
    },
    { name: 'interviewDate', type: 'date', admin: { position: 'sidebar' } },
    {
      name: 'history',
      type: 'array',
      admin: { readOnly: true, description: 'Every status change.' },
      fields: [
        { name: 'status', type: 'text' },
        { name: 'at', type: 'date' },
        { name: 'by', type: 'text' },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ req, doc, previousDoc, operation }) => {
        if (operation === 'update' && previousDoc?.status !== doc.status) {
          await recordAudit(req, {
            action: 'application.status-changed',
            targetType: 'applications',
            targetId: String(doc.id),
            detail: `${previousDoc?.status} to ${doc.status}`,
          })
        }
      },
    ],
  },
}
