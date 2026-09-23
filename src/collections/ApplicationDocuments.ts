/**
 * Documents uploaded with an application: birth certificates, result slips, photographs.
 *
 * These are a child's identity documents, so they go to the private bucket and are
 * readable only by the admissions team, through the same signed-URL route as everything
 * else private.
 */

import type { CollectionConfig } from 'payload'
import { denyAll, roles } from '../access/roles'
import { assertAllowedUpload } from '../lib/upload-safety'
import { hideStorageKey } from '../access/private-files'

export const ApplicationDocuments: CollectionConfig = {
  slug: 'applicationDocuments',
  labels: { singular: 'Application document', plural: 'Application documents' },
  admin: {
    useAsTitle: 'filename',
    group: 'Admissions',
    hidden: ({ user }) => !['superAdmin', 'admissions'].includes((user as { role?: string })?.role ?? ''),
  },
  access: {
    // Created by the application route on the applicant's behalf.
    create: denyAll,
    read: roles('superAdmin', 'admissions'),
    update: denyAll,
    delete: roles('superAdmin'),
  },
  upload: {
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    disableLocalStorage: true,
  },
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
  ],
  hooks: {
    afterRead: [hideStorageKey],
    beforeValidate: [
      async ({ req, data }) => {
        if (req.file) await assertAllowedUpload(req.file, 'document')
        return data
      },
    ],
  },
}
