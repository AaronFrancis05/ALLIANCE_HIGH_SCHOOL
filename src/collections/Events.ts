/**
 * School events (FR-20). Each event can be added to a phone calendar through the
 * ICS download on the events page.
 */

import type { CollectionConfig } from 'payload'
import { publishedOrStaff, roles } from '../access/roles'
import { revalidateAfterChange } from '../lib/revalidate'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'audience', '_status'],
    group: 'Content',
  },
  access: {
    read: publishedOrStaff,
    create: roles('superAdmin', 'editor'),
    update: roles('superAdmin', 'editor'),
    delete: roles('superAdmin', 'editor'),
  },
  versions: { drafts: true, maxPerDoc: 10 },
  fields: [
    { name: 'title', type: 'text', required: true },
    ...slugField(),
    { name: 'summary', type: 'textarea', required: true, maxLength: 240 },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    { name: 'location', type: 'text', defaultValue: 'Alliance High School Nansana' },
    {
      name: 'audience',
      type: 'select',
      defaultValue: 'all',
      options: [
        { label: 'Everyone', value: 'all' },
        { label: 'Parents', value: 'parents' },
        { label: 'Students', value: 'students' },
        { label: 'Alumni', value: 'alumni' },
        { label: 'Staff', value: 'staff' },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'body', type: 'richText' },
    ...seoFields(),
  ],
  hooks: {
    afterChange: [revalidateAfterChange(({ doc }) => ['/events', `/events/${doc.slug}`, '/'])],
  },
}
