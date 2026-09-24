/**
 * News posts (FR-01, FR-04, FR-24). Drafts, versions and scheduled publishing included.
 */

import type { CollectionConfig } from 'payload'
import { publishedOrStaff, roles } from '../access/roles'
import { revalidateAfterChange } from '../lib/revalidate'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'News post', plural: 'News' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    group: 'Content',
    livePreview: {
      url: ({ data }) => `${process.env.NEXT_PUBLIC_SITE_URL}/news/${data?.slug}`,
    },
  },
  access: {
    read: publishedOrStaff,
    create: roles('superAdmin', 'editor', 'teacher', 'hod'),
    update: roles('superAdmin', 'editor', 'teacher', 'hod'),
    delete: roles('superAdmin', 'editor'),
  },
  versions: {
    drafts: {
      autosave: { interval: 2000 },
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 140 },
    ...slugField(),
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 240,
      admin: { description: 'One or two sentences shown on the news listing and in search results.' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Landscape photograph taken at the event itself.' },
    },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true, index: true },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
      defaultValue: ({ user }) => user?.id,
    },
    { name: 'body', type: 'richText', required: true },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      maxRows: 40,
      admin: { description: 'Up to 40 photographs from the event.' },
    },
    ...seoFields(),
  ],
  hooks: {
    afterChange: [revalidateAfterChange(({ doc }) => ['/news', `/news/${doc.slug}`, '/'])],
  },
}
