/**
 * The public staff directory. Separate from `users`: a person can appear here without
 * having a login, and a login never exposes personal details to the public.
 */

import type { CollectionConfig } from 'payload'
import { anyone, roles } from '../access/roles'
import { revalidateAfterChange } from '../lib/revalidate'

export const StaffProfiles: CollectionConfig = {
  slug: 'staffProfiles',
  labels: { singular: 'Staff profile', plural: 'Staff directory' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'title', 'group', 'order'],
    group: 'Content',
    description: 'Shown on the Leadership and Our staff pages. Lower order numbers appear first; the first person in each leadership group is featured.',
  },
  access: {
    read: anyone,
    create: roles('superAdmin', 'editor'),
    update: roles('superAdmin', 'editor'),
    delete: roles('superAdmin', 'editor'),
  },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'For example Mr. John Okello.' } },
    { name: 'title', type: 'text', required: true, admin: { description: 'For example Head Teacher.' } },
    {
      name: 'group',
      type: 'select',
      required: true,
      defaultValue: 'teaching',
      options: [
        { label: 'Director and Founder', value: 'director' },
        { label: 'School administration', value: 'administration' },
        { label: 'Board of Governors', value: 'board' },
        { label: 'Heads of Department', value: 'hods' },
        { label: 'Teaching staff', value: 'teaching' },
        { label: 'Support staff', value: 'support' },
      ],
    },
    { name: 'department', type: 'relationship', relationTo: 'departments' },
    {
      name: 'level',
      type: 'select',
      options: [
        { label: 'O-Level', value: 'o' },
        { label: 'A-Level', value: 'a' },
      ],
      admin: { description: 'For heads of subject: the Our staff page lists O-Level and A-Level separately.' },
    },
    { name: 'bio', type: 'textarea', maxLength: 400 },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Square headshot, same neutral background for everyone. Until one is added, a silhouette is shown.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
  ],
  hooks: { afterChange: [revalidateAfterChange(() => ['/about', '/about/leadership', '/about/staff'])] },
}
