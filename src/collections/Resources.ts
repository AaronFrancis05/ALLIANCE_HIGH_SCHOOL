/**
 * e-Library resources: notes, past papers, textbooks, schemes and videos (FR-06 … FR-09).
 *
 * Files go to the private bucket and are never linked directly. The browser only ever
 * receives `/api/files/resource/<id>`, which re-checks access and issues a 5-minute
 * signed URL.
 */

import type { CollectionConfig } from 'payload'
import { CLASS_LABELS, SCHOOL_CLASSES, readResources, writeResources } from '../access/resources'
import { departmentId, hasRole, type StaffUser } from '../access/roles'
import { assertAllowedUpload } from '../lib/upload-safety'

export const RESOURCE_TYPES = [
  { label: 'Notes', value: 'notes' },
  { label: 'Past paper', value: 'pastPaper' },
  { label: 'Textbook', value: 'textbook' },
  { label: 'Scheme of work', value: 'scheme' },
  { label: 'Video lesson', value: 'video' },
  { label: 'Other', value: 'other' },
] as const

export const Resources: CollectionConfig = {
  slug: 'resources',
  labels: { singular: 'Resource', plural: 'e-Library' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'subject', 'classes', 'visibility', 'downloads'],
    group: 'e-Library',
    description: 'Notes, past papers, textbooks and schemes of work for students.',
  },
  access: {
    read: readResources,
    create: writeResources,
    update: writeResources,
    delete: ({ req }) => hasRole(req.user as StaffUser, 'superAdmin', 'registrar'),
  },
  upload: {
    // Stored in the private bucket; see payload.config.ts.
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    disableLocalStorage: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'One or two lines so students know what is inside.' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'notes',
      options: [...RESOURCE_TYPES],
      index: true,
    },
    {
      name: 'department',
      type: 'relationship',
      relationTo: 'departments',
      required: true,
      index: true,
      admin: {
        description: 'Heads of Department may only add resources to their own department.',
      },
      defaultValue: ({ user }) => departmentId(user as StaffUser) ?? undefined,
    },
    { name: 'subject', type: 'relationship', relationTo: 'subjects', required: true, index: true },
    {
      name: 'classes',
      type: 'select',
      hasMany: true,
      required: true,
      options: SCHOOL_CLASSES.map((value) => ({ label: CLASS_LABELS[value], value })),
      admin: { description: 'Which classes this is for.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'year', type: 'number', min: 1990, max: 2100, admin: { width: '50%' } },
        {
          name: 'term',
          type: 'select',
          options: [
            { label: 'Term 1', value: '1' },
            { label: 'Term 2', value: '2' },
            { label: 'Term 3', value: '3' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'students',
      options: [
        { label: 'Public: anyone on the website', value: 'public' },
        { label: 'Signed-in students', value: 'students' },
        { label: 'Only the classes listed above', value: 'classes' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        description: 'Use instead of a file for a YouTube lesson or an external link.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return true
        return /^https:\/\//.test(value) ? true : 'Links must start with https://'
      },
    },
    {
      name: 'downloads',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar', description: 'Times this has been opened.' },
      access: { update: () => false },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar' },
      access: { update: () => false },
    },
  ],
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
  },
}
