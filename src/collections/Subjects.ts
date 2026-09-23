/**
 * Subjects taught at the school. Library resources are filed under these.
 */

import type { CollectionConfig } from 'payload'
import { anyone, roles } from '../access/roles'
import { CLASS_LABELS, SCHOOL_CLASSES } from '../access/resources'

export const Subjects: CollectionConfig = {
  slug: 'subjects',
  labels: { singular: 'Subject', plural: 'Subjects' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'department', 'level'],
    group: 'Academics',
  },
  access: {
    read: anyone,
    create: roles('superAdmin', 'editor', 'registrar', 'hod'),
    update: roles('superAdmin', 'editor', 'registrar', 'hod'),
    delete: roles('superAdmin'),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'code', type: 'text', required: true, unique: true },
    {
      name: 'department',
      type: 'relationship',
      relationTo: 'departments',
      required: true,
    },
    {
      name: 'level',
      type: 'select',
      required: true,
      defaultValue: 'both',
      options: [
        { label: 'O-Level', value: 'o' },
        { label: 'A-Level', value: 'a' },
        { label: 'Both', value: 'both' },
      ],
    },
    {
      name: 'classes',
      type: 'select',
      hasMany: true,
      options: SCHOOL_CLASSES.map((value) => ({ label: CLASS_LABELS[value], value })),
      admin: { description: 'Classes that take this subject.' },
    },
  ],
}
