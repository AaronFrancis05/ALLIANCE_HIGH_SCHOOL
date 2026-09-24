/**
 * Fee clearance per student per term (FR-14).
 *
 * Only the bursar writes these. The registrar cannot, and the bursar cannot read report
 * cards: the two duties stay separate, and every change is audit-logged.
 */

import type { CollectionConfig } from 'payload'
import { readClearances, writeClearances } from '../access/report-cards'
import { hasRole, type StaffUser } from '../access/roles'
import { recordAudit } from '../lib/audit'

export const FeeClearances: CollectionConfig = {
  slug: 'feeClearances',
  labels: { singular: 'Fee clearance', plural: 'Fee clearances' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'student', 'term', 'status', 'updatedAt'],
    group: 'Results',
    description: 'Which students are cleared to download their report card each term.',
  },
  access: {
    read: readClearances,
    create: writeClearances,
    update: writeClearances,
    delete: ({ req }) => hasRole(req.user as StaffUser, 'superAdmin'),
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
      hooks: {
        beforeChange: [
          ({ data, originalDoc }) => {
            const student = data?.student ?? originalDoc?.student
            const term = data?.term ?? originalDoc?.term
            const studentLabel = typeof student === 'object' ? student?.admissionNo : student
            const termLabel = typeof term === 'object' ? term?.label : term
            return [studentLabel, termLabel].filter(Boolean).join(' - ')
          },
        ],
      },
    },
    { name: 'student', type: 'relationship', relationTo: 'students', required: true, index: true },
    { name: 'term', type: 'relationship', relationTo: 'academicTerms', required: true, index: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'blocked',
      options: [
        { label: 'Cleared', value: 'cleared' },
        { label: 'Blocked', value: 'blocked' },
      ],
      admin: { description: 'Blocked students see a polite message pointing them to the Bursar.' },
    },
    {
      name: 'reason',
      type: 'text',
      admin: {
        condition: (data) => data?.status === 'blocked',
        description: 'Shown to the student. Keep it factual, for example "outstanding balance".',
      },
    },
    {
      name: 'updatedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar' },
      access: { update: () => false },
    },
  ],
  indexes: [{ fields: ['student', 'term'], unique: true }],
  hooks: {
    beforeChange: [
      ({ req, data }) => (req.user?.collection === 'users' ? { ...data, updatedBy: req.user.id } : data),
    ],
    afterChange: [
      async ({ req, doc, previousDoc, operation }) => {
        if (operation === 'create' || previousDoc?.status !== doc.status) {
          await recordAudit(req, {
            action: 'clearance.changed',
            targetType: 'feeClearances',
            targetId: String(doc.id),
            detail: `${previousDoc?.status ?? 'new'} to ${doc.status}`,
          })
        }
      },
    ],
  },
}
