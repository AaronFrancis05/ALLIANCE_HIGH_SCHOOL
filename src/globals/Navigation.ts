/**
 * The header menu and footer columns, editable without a developer.
 */

import type { GlobalConfig } from 'payload'
import { anyone, roles } from '../access/roles'
import { revalidateGlobalAfterChange } from '../lib/revalidate'

const linkFields = [
  { name: 'label', type: 'text' as const, required: true },
  { name: 'href', type: 'text' as const, required: true, admin: { description: 'For example /admissions.' } },
]

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Menus',
  admin: { group: 'Settings', description: 'The top menu and the footer links.' },
  access: { read: anyone, update: roles('superAdmin', 'editor') },
  fields: [
    {
      name: 'header',
      type: 'array',
      label: 'Header menu',
      maxRows: 8,
      fields: [
        ...linkFields,
        {
          name: 'children',
          type: 'array',
          label: 'Drop-down items',
          maxRows: 8,
          fields: [...linkFields, { name: 'description', type: 'text' }],
        },
      ],
    },
    {
      name: 'footer',
      type: 'array',
      label: 'Footer columns',
      maxRows: 4,
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'links', type: 'array', fields: linkFields },
      ],
    },
    {
      name: 'announcement',
      type: 'group',
      label: 'Announcement bar',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        { name: 'text', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
  ],
  hooks: { afterChange: [revalidateGlobalAfterChange(() => ['/'])] },
}
