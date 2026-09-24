/**
 * Admissions content the office changes every year: requirements, fees and whether
 * applications are open.
 */

import type { GlobalConfig } from 'payload'
import { anyone, roles } from '../access/roles'
import { revalidateGlobalAfterChange } from '../lib/revalidate'

export const AdmissionsSettings: GlobalConfig = {
  slug: 'admissionsSettings',
  label: 'Admissions settings',
  admin: { group: 'Settings', description: 'Requirements, fees and the online application switch.' },
  access: { read: anyone, update: roles('superAdmin', 'editor', 'admissions', 'bursar') },
  fields: [
    {
      name: 'applicationsOpen',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'When off, the apply page explains that applications are closed.',
      },
    },
    { name: 'intakeNote', type: 'text', admin: { description: 'For example "Senior One intake, 2027".' } },
    {
      name: 'requirements',
      type: 'array',
      label: 'What to bring',
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    {
      name: 'fees',
      type: 'array',
      label: 'Fees structure',
      admin: { description: 'Shown as a table. Use the same figures as the printed structure.' },
      fields: [
        { name: 'category', type: 'text', required: true, admin: { description: 'For example Senior One boarding.' } },
        { name: 'tuition', type: 'text', required: true },
        { name: 'other', type: 'text' },
        { name: 'total', type: 'text', required: true },
      ],
    },
    { name: 'feesNote', type: 'textarea', admin: { description: 'Small print under the fees table.' } },
    { name: 'feesDocument', type: 'relationship', relationTo: 'downloads' },
    {
      name: 'faqs',
      type: 'array',
      label: 'Frequently asked questions',
      admin: { description: 'These are marked up for Google, which can show them under the search result.' },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
  hooks: { afterChange: [revalidateGlobalAfterChange(() => ['/admissions', '/admissions/fees', '/admissions/apply'])] },
}
