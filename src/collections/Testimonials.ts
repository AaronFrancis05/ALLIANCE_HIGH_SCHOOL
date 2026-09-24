/**
 * Short quotes from parents, students and alumni, shown on the home page.
 */

import type { CollectionConfig } from 'payload'
import { anyone, roles } from '../access/roles'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'featured'], group: 'Content' },
  access: {
    read: anyone,
    create: roles('superAdmin', 'editor'),
    update: roles('superAdmin', 'editor'),
    delete: roles('superAdmin', 'editor'),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'text',
      required: true,
      admin: { description: 'For example Parent, Senior Six student, Alumnus of 2014.' },
    },
    { name: 'quote', type: 'textarea', required: true, maxLength: 320 },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show on the home page.' },
    },
    {
      name: 'consent',
      type: 'checkbox',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Confirm this person agreed to their words and picture being published.',
      },
    },
  ],
}
