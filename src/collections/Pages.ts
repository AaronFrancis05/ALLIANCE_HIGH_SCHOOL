/**
 * Editable pages built from blocks (FR-01).
 *
 * The fixed pages (home, admissions, academics) are React routes; this collection covers
 * everything the school wants to add later without a developer.
 */

import type { CollectionConfig } from 'payload'
import { publishedOrStaff, roles } from '../access/roles'
import { revalidateAfterChange } from '../lib/revalidate'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { contentBlocks } from '../blocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Content',
    livePreview: { url: ({ data }) => `${process.env.NEXT_PUBLIC_SITE_URL}/${data?.slug}` },
  },
  access: {
    read: publishedOrStaff,
    create: roles('superAdmin', 'editor'),
    update: roles('superAdmin', 'editor'),
    delete: roles('superAdmin'),
  },
  versions: { drafts: { autosave: { interval: 2000 }, schedulePublish: true }, maxPerDoc: 20 },
  fields: [
    { name: 'title', type: 'text', required: true },
    ...slugField(),
    {
      name: 'intro',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'Short paragraph under the page heading.' },
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    {
      name: 'layout',
      type: 'blocks',
      required: true,
      minRows: 1,
      blocks: contentBlocks,
      admin: { description: 'Build the page by stacking blocks.' },
    },
    ...seoFields(),
  ],
  hooks: { afterChange: [revalidateAfterChange(({ doc }) => [`/${doc.slug}`])] },
}
