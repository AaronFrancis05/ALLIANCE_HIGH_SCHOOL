/**
 * Report cards (FR-12, FR-13, FR-15).
 *
 * The PDF lives in the private bucket. Nothing links to it. The portal calls
 * `/api/report-cards/<id>/file`, which runs the three-part gate in
 * `src/access/report-cards.ts` and only then issues a short-lived signed URL.
 */

import type { CollectionConfig } from 'payload'
import { readReportCards, writeReportCards } from '../access/report-cards'
import { hasRole, type StaffUser } from '../access/roles'
import { assertAllowedUpload } from '../lib/upload-safety'
import { recordAudit } from '../lib/audit'

export const ReportCards: CollectionConfig = {
  slug: 'reportCards',
  labels: { singular: 'Report card', plural: 'Report cards' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'student', 'term', 'published', 'updatedAt'],
    group: 'Results',
    description: 'Uploaded by the registrar. Students see theirs once the term is released and fees are cleared.',
  },
  access: {
    read: readReportCards,
    create: writeReportCards,
    update: writeReportCards,
    delete: ({ req }) => hasRole(req.user as StaffUser, 'superAdmin'),
  },
  upload: {
    mimeTypes: ['application/pdf'],
    disableLocalStorage: true,
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
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Publishing is not enough on its own: the term must also be released and the student cleared.',
      },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar' },
      access: { update: () => false },
    },
  ],
  indexes: [{ fields: ['student', 'term'], unique: true }],
  hooks: {
    beforeValidate: [
      async ({ req, data, operation }) => {
        if (req.file) await assertAllowedUpload(req.file, 'document')
        if (operation === 'create' && req.user?.collection === 'users') {
          return { ...data, uploadedBy: req.user.id }
        }
        return data
      },
    ],
    afterChange: [
      async ({ req, doc, operation }) => {
        if (operation === 'create') {
          await recordAudit(req, {
            action: 'reportcard.uploaded',
            targetType: 'reportCards',
            targetId: String(doc.id),
          })
        }
      },
    ],
  },
}
