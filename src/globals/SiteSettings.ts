/**
 * Everything about the school that appears in more than one place: contact details,
 * identity statements, statistics and social links.
 *
 * These feed the header, the footer, the home page and the structured data Google reads,
 * so the office can correct a phone number once and have it change everywhere.
 */

import type { GlobalConfig } from 'payload'
import { anyone, roles } from '../access/roles'
import { revalidateGlobalAfterChange } from '../lib/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'School details',
  admin: {
    group: 'Settings',
    description: 'Name, contacts, identity statements and the numbers shown on the home page.',
  },
  access: {
    read: anyone,
    update: roles('superAdmin', 'editor'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          fields: [
            { name: 'schoolName', type: 'text', required: true, defaultValue: 'Alliance High School Nansana' },
            { name: 'shortName', type: 'text', defaultValue: 'Alliance High Nansana' },
            {
              name: 'motto',
              type: 'text',
              required: true,
              defaultValue: 'Adfecto Excellencia',
              admin: { description: 'As it appears on the crest.' },
            },
            {
              name: 'mottoMeaning',
              type: 'text',
              admin: { description: 'Plain English meaning, shown beside the motto.' },
            },
            {
              name: 'tagline',
              type: 'text',
              maxLength: 120,
              admin: { description: 'One line under the school name in the hero.' },
            },
            {
              name: 'foundedYear',
              type: 'text',
              admin: { description: 'Leave the bracketed placeholder until the school confirms it.' },
            },
            { name: 'vision', type: 'textarea', required: true },
            { name: 'mission', type: 'textarea', required: true },
            {
              name: 'coreValues',
              type: 'array',
              maxRows: 6,
              fields: [
                { name: 'value', type: 'text', required: true },
                { name: 'description', type: 'text' },
              ],
            },
            {
              name: 'themeOfTheYear',
              type: 'group',
              label: 'Theme of the year',
              fields: [
                { name: 'year', type: 'text' },
                { name: 'theme', type: 'text' },
                { name: 'reference', type: 'text', admin: { description: 'Optional scripture or source.' } },
              ],
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'phones',
              type: 'array',
              maxRows: 4,
              fields: [
                { name: 'label', type: 'text', admin: { description: 'For example Head Teacher, Admissions.' } },
                { name: 'number', type: 'text', required: true },
                { name: 'whatsapp', type: 'checkbox', defaultValue: false },
              ],
            },
            {
              name: 'emails',
              type: 'array',
              maxRows: 4,
              fields: [
                { name: 'label', type: 'text' },
                { name: 'address', type: 'email', required: true },
              ],
            },
            {
              name: 'address',
              type: 'group',
              fields: [
                { name: 'line1', type: 'text', required: true, defaultValue: 'Nansana' },
                { name: 'district', type: 'text', required: true, defaultValue: 'Wakiso District' },
                { name: 'country', type: 'text', required: true, defaultValue: 'Uganda' },
                { name: 'poBox', type: 'text' },
                {
                  name: 'mapEmbedUrl',
                  type: 'text',
                  admin: { description: 'Google Maps embed address for the contact page.' },
                },
                { name: 'latitude', type: 'number', admin: { step: 0.000001 } },
                { name: 'longitude', type: 'number', admin: { step: 0.000001 } },
              ],
            },
            {
              name: 'officeHours',
              type: 'array',
              fields: [
                { name: 'days', type: 'text', required: true },
                { name: 'hours', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          label: 'Numbers',
          fields: [
            {
              name: 'stats',
              type: 'array',
              maxRows: 4,
              admin: { description: 'Shown as counters on the home page. Only use figures the school confirms.' },
              fields: [
                { name: 'value', type: 'text', required: true },
                { name: 'label', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          label: 'Social',
          fields: [
            {
              name: 'social',
              type: 'array',
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'X', value: 'x' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'YouTube', value: 'youtube' },
                    { label: 'TikTok', value: 'tiktok' },
                    { label: 'LinkedIn', value: 'linkedin' },
                  ],
                },
                { name: 'url', type: 'text', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: { afterChange: [revalidateGlobalAfterChange(() => ['/', '/about', '/contact'])] },
}
