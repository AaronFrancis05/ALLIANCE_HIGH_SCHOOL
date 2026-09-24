/**
 * Per-page search engine fields (FR-24).
 *
 * Kept deliberately small: a title, a description and a social image. Anything longer
 * than Google will show is flagged in the admin description rather than rejected.
 */

import type { Field } from 'payload'

export function seoFields(): Field[] {
  return [
    {
      type: 'collapsible',
      label: 'Search engine and social sharing',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'meta',
          type: 'group',
          label: false,
          fields: [
            {
              name: 'title',
              type: 'text',
              maxLength: 70,
              admin: {
                description:
                  'Up to 60 characters shows in full on Google. Leave empty to use the page title.',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              maxLength: 180,
              admin: {
                description: 'Up to 155 characters. This is the grey text under the link on Google.',
              },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Shown when the page is shared on WhatsApp or Facebook. 1200x630 works best.',
              },
            },
            {
              name: 'noindex',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Keep this page out of search results.' },
            },
          ],
        },
      ],
    },
  ]
}
