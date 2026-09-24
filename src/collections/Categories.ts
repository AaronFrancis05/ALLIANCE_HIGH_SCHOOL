/** News categories, for example Academics, Sports, Announcements. */

import type { CollectionConfig } from 'payload'
import { anyone, roles } from '../access/roles'
import { slugField } from '../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug'], group: 'Content' },
  access: {
    read: anyone,
    create: roles('superAdmin', 'editor'),
    update: roles('superAdmin', 'editor'),
    delete: roles('superAdmin'),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    ...slugField('name'),
    {
      name: 'colour',
      type: 'select',
      defaultValue: 'maroon',
      options: [
        { label: 'Maroon', value: 'maroon' },
        { label: 'Gold', value: 'gold' },
        { label: 'Ink', value: 'ink' },
      ],
      admin: { description: 'Tag colour on the news cards.' },
    },
  ],
}
