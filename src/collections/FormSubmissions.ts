/**
 * Contact, alumni and careers enquiries (FR-21).
 *
 * Written by the public form routes after validation and spam checks, then emailed to
 * the office. Nobody can edit one: the record is what was actually sent.
 */

import type { CollectionConfig } from 'payload'
import { denyAll, roles } from '../access/roles'

export const FormSubmissions: CollectionConfig = {
  slug: 'formSubmissions',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['form', 'name', 'subject', 'handled', 'createdAt'],
    group: 'Administration',
    description: 'Messages sent through the website.',
  },
  access: {
    create: denyAll,
    read: roles('superAdmin', 'editor', 'admissions'),
    update: roles('superAdmin', 'editor', 'admissions'), // only to tick "handled"
    delete: roles('superAdmin'),
  },
  fields: [
    {
      name: 'form',
      type: 'select',
      required: true,
      options: [
        { label: 'Contact', value: 'contact' },
        { label: 'Alumni registration', value: 'alumni' },
        { label: 'Job application', value: 'careers' },
        { label: 'Visit request', value: 'visit' },
      ],
      access: { update: () => false },
    },
    { name: 'name', type: 'text', required: true, access: { update: () => false } },
    { name: 'email', type: 'email', access: { update: () => false } },
    { name: 'phone', type: 'text', access: { update: () => false } },
    { name: 'subject', type: 'text', access: { update: () => false } },
    { name: 'message', type: 'textarea', required: true, access: { update: () => false } },
    {
      name: 'meta',
      type: 'group',
      admin: { readOnly: true },
      access: { update: () => false },
      fields: [
        { name: 'yearOfCompletion', type: 'text' },
        { name: 'occupation', type: 'text' },
        { name: 'position', type: 'text' },
      ],
    },
    {
      name: 'handled',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Tick once the office has replied.' },
    },
  ],
}
