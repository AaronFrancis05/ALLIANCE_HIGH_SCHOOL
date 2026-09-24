/**
 * Photo albums for the gallery (FR-01). Filterable by year and category.
 */

import type { CollectionConfig } from 'payload'
import { publishedOrStaff, roles } from '../access/roles'
import { revalidateAfterChange } from '../lib/revalidate'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'

export const GALLERY_CATEGORIES = [
  { label: 'Academics', value: 'academics' },
  { label: 'Sports', value: 'sports' },
  { label: 'Music, Dance and Drama', value: 'mdd' },
  { label: 'Visitation Day', value: 'visitation' },
  { label: 'Career Day', value: 'career' },
  { label: 'Speech Day', value: 'speech' },
  { label: 'Clubs', value: 'clubs' },
  { label: 'Campus', value: 'campus' },
] as const

export const Albums: CollectionConfig = {
  slug: 'albums',
  labels: { singular: 'Album', plural: 'Gallery albums' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'year', '_status'],
    group: 'Content',
  },
  access: {
    read: publishedOrStaff,
    create: roles('superAdmin', 'editor', 'teacher'),
    update: roles('superAdmin', 'editor', 'teacher'),
    delete: roles('superAdmin', 'editor'),
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    ...slugField(),
    { name: 'description', type: 'textarea', maxLength: 300 },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          options: [...GALLERY_CATEGORIES],
          admin: { width: '50%' },
        },
        {
          name: 'year',
          type: 'number',
          required: true,
          defaultValue: () => new Date().getFullYear(),
          admin: { width: '50%' },
        },
      ],
    },
    { name: 'cover', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: { description: 'Drag in the whole set at once. Each photo needs a description.' },
    },
    ...seoFields(),
  ],
  hooks: {
    afterChange: [revalidateAfterChange(({ doc }) => ['/gallery', `/gallery/${doc.slug}`])],
  },
}
