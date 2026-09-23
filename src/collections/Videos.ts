/**
 * Videos (FR-03). YouTube is preferred: it costs nothing to stream and adds a second
 * place for the school to be found. The id is parsed from the URL and stored on its
 * own, so nothing user-supplied is ever fetched server-side (A10).
 */

import type { CollectionConfig } from 'payload'
import { publishedOrStaff, roles } from '../access/roles'
import { slugField } from '../fields/slug'

/** Accepts the usual YouTube address shapes and returns the 11-character id. */
export function parseYouTubeId(input: string): string | null {
  const patterns = [
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
    /^https?:\/\/youtu\.be\/([\w-]{11})/,
    /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([\w-]{11})/,
    /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/,
    /^([\w-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = input.trim().match(pattern)
    if (match) return match[1]
  }
  return null
}

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    group: 'Content',
  },
  access: {
    read: publishedOrStaff,
    create: roles('superAdmin', 'editor'),
    update: roles('superAdmin', 'editor'),
    delete: roles('superAdmin', 'editor'),
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    ...slugField(),
    { name: 'description', type: 'textarea', maxLength: 300 },
    {
      name: 'youtubeUrl',
      type: 'text',
      required: true,
      admin: { description: 'Paste the YouTube address. Shorts and youtu.be links work too.' },
      validate: (value: string | null | undefined) =>
        value && parseYouTubeId(value) ? true : 'That does not look like a YouTube link.',
    },
    {
      name: 'youtubeId',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
      hooks: {
        beforeChange: [({ data }) => (data?.youtubeUrl ? parseYouTubeId(String(data.youtubeUrl)) : undefined)],
      },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'Still image shown before the video loads. The player itself only loads when someone clicks.',
      },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'school',
      options: [
        { label: 'School documentary', value: 'school' },
        { label: 'Head Teacher welcome', value: 'welcome' },
        { label: 'Event highlights', value: 'event' },
        { label: 'Testimonial', value: 'testimonial' },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar' },
    },
  ],
}
