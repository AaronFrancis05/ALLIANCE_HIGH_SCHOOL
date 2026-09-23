/**
 * Academic years and terms (FR-13).
 *
 * `resultsReleased` is the registrar's switch. Until it is on, no report card for that
 * term can be downloaded by anyone, however cleared the student is.
 */

import type { CollectionConfig } from 'payload'
import { anyone, hasRole, roles, type StaffUser } from '../access/roles'
import { recordAudit } from '../lib/audit'

export const AcademicTerms: CollectionConfig = {
  slug: 'academicTerms',
  labels: { singular: 'Term', plural: 'Terms' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'year', 'term', 'resultsReleased', 'current'],
    group: 'Academics',
    description: 'School terms, reporting dates and the results release switch.',
  },
  access: {
    read: anyone, // term dates are public information
    create: roles('superAdmin', 'registrar'),
    update: roles('superAdmin', 'registrar'),
    delete: roles('superAdmin'),
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
      hooks: {
        beforeChange: [({ data }) => (data?.year && data?.term ? `${data.year} Term ${data.term}` : undefined)],
      },
    },
    { name: 'year', type: 'number', required: true, min: 2000, max: 2100, index: true },
    {
      name: 'term',
      type: 'select',
      required: true,
      options: [
        { label: 'Term 1', value: '1' },
        { label: 'Term 2', value: '2' },
        { label: 'Term 3', value: '3' },
      ],
      index: true,
    },
    { name: 'startDate', type: 'date', required: true },
    { name: 'endDate', type: 'date', required: true },
    {
      name: 'current',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'The term the school is in now.' },
    },
    {
      name: 'resultsReleased',
      type: 'checkbox',
      defaultValue: false,
      access: { update: ({ req }) => hasRole(req.user as StaffUser, 'registrar') },
      admin: {
        position: 'sidebar',
        description:
          'When this is on, cleared students can download their report cards for this term. Turn it on only when the school is ready.',
      },
    },
    {
      name: 'reportingDates',
      type: 'array',
      labels: { singular: 'Reporting date', plural: 'Reporting dates' },
      admin: { description: 'Shown on the Admissions page (FR-20).' },
      fields: [
        { name: 'classes', type: 'text', required: true, admin: { description: 'For example "S.1, S.2 and S.3".' } },
        { name: 'date', type: 'date', required: true },
        { name: 'note', type: 'text' },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ req, doc, previousDoc, operation }) => {
        if (operation === 'update' && !previousDoc?.resultsReleased && doc.resultsReleased) {
          await recordAudit(req, {
            action: 'reportcard.term-released',
            targetType: 'academicTerms',
            targetId: String(doc.id),
            detail: doc.label,
          })
        }
      },
    ],
  },
}
