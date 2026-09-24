/**
 * URL slug, generated from the title but editable, and never changed silently
 * afterwards (an existing link must keep working).
 */

import type { Field } from 'payload'

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90)
}

export function slugField(sourceField = 'title'): Field[] {
  return [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'The web address. Changing it breaks links that already exist.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data, operation }) => {
            if (value) return slugify(value)
            if (operation === 'create' && data?.[sourceField]) return slugify(String(data[sourceField]))
            return value
          },
        ],
      },
    },
  ]
}
