/**
 * Academic departments. Used to scope what a Head of Department may manage (FR-07)
 * and to group subjects and library resources.
 */

import type { CollectionConfig } from 'payload'
import { anyone, roles } from '../access/roles'

export const Departments: CollectionConfig = {
  slug: 'departments',
  labels: { singular: 'Department', plural: 'Departments' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'head'],
    group: 'Academics',
  },
  access: {
    read: anyone,
    create: roles('superAdmin', 'editor', 'registrar'),
    update: roles('superAdmin', 'editor', 'registrar'),
    delete: roles('superAdmin'),
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
      filterOptions: { role: { in: ['hod', 'teacher'] } },
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
