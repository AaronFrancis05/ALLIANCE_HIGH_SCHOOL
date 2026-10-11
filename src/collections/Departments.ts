/**
 * Academic departments. Used to scope what a Head of Department may manage (FR-07)
 * and to group subjects and library resources.
 */

import type { CollectionConfig } from 'payload'
import { anyone, hiddenUnless, roles, superAdminOnly } from '../access/roles'

export const Departments: CollectionConfig = {
  slug: 'departments',
  labels: { singular: 'Department', plural: 'Departments' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'head'],
    group: 'Academics',
    hidden: hiddenUnless('editor', 'secretary'),
  },
  access: {
    read: anyone,
    create: roles('editor', 'secretary'),
    update: roles('editor', 'secretary'),
    delete: superAdminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Short code, for example SCI or HUM.' },
    },
    {
      name: 'head',
      type: 'relationship',
      relationTo: 'users',
      filterOptions: { roles: { in: ['hod', 'teacher'] } },
      admin: { description: 'Head of Department.' },
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'One action shot that represents the department.' },
    },
  ],
}
