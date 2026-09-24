/**
 * Posts the school is recruiting for, shown on the careers page.
 *
 * A vacancy leaves the careers page on its own once its closing date passes; its own page
 * stays up and says the post has closed, so a link already shared on WhatsApp still
 * explains itself.
 */

import type { CollectionConfig } from 'payload'
import { publishedOrStaff, roles } from '../access/roles'
import { revalidateAfterChange } from '../lib/revalidate'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'

export const Vacancies: CollectionConfig = {
  slug: 'vacancies',
  labels: { singular: 'Vacancy', plural: 'Vacancies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'employment', 'closingDate', '_status'],
    group: 'Content',
    description: 'Posts the school is recruiting for. Each one leaves the careers page after its closing date.',
  },
  access: {
    read: publishedOrStaff,
    create: roles('superAdmin', 'editor'),
    update: roles('superAdmin', 'editor'),
    delete: roles('superAdmin', 'editor'),
  },
  versions: { drafts: true, maxPerDoc: 10 },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'For example "Biology teacher, A-Level".' } },
    ...slugField(),
    { name: 'summary', type: 'textarea', required: true, maxLength: 240 },
    {
      type: 'row',
      fields: [
        {
          name: 'employment',
          type: 'select',
          required: true,
          defaultValue: 'fullTime',
          options: [
            { label: 'Full time', value: 'fullTime' },
            { label: 'Part time', value: 'partTime' },
            { label: 'Contract', value: 'contract' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'closingDate',
          type: 'date',
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayOnly' },
            description: 'Leave empty if the post stays open until filled.',
          },
        },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      admin: { description: 'The duties, the qualifications asked for, and anything else applicants should know.' },
    },
    {
      name: 'howToApply',
      type: 'textarea',
      admin: {
        description:
          'Optional. For example "Hand in a CV and copies of certificates at the school office." The enquiry form is always shown below it.',
      },
    },
    ...seoFields(),
  ],
  hooks: {
    afterChange: [revalidateAfterChange(({ doc }) => ['/careers', `/careers/${doc.slug}`])],
  },
}
