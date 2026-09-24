/**
 * Public downloads: circulars, admission forms, the fees structure PDF.
 * These are genuinely public, so they live in the media bucket.
 */

import type { CollectionConfig } from 'payload'
import { anyone, roles } from '../access/roles'
import { assertAllowedUpload } from '../lib/upload-safety'

export const Downloads: CollectionConfig = {
  slug: 'downloads',
  labels: { singular: 'Download', plural: 'Downloads' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: anyone,
    create: roles('superAdmin', 'editor', 'registrar', 'bursar', 'admissions'),
    update: roles('superAdmin', 'editor', 'registrar', 'bursar', 'admissions'),
    delete: roles('superAdmin', 'editor'),
  },
  upload: {
    mimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', maxLength: 240 },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'circular',
      options: [
        { label: 'Circular', value: 'circular' },
        { label: 'Form', value: 'form' },
        { label: 'Fees structure', value: 'fees' },
        { label: 'Policy', value: 'policy' },
        { label: 'Newsletter', value: 'newsletter' },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ req, data }) => {
        if (req.file) await assertAllowedUpload(req.file, 'document')
        return data
      },
    ],
  },
}
