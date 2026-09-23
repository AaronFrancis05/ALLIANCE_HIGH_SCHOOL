/**
 * Every public image and file in the CMS (FR-02).
 *
 * Uploads are converted to WebP at five widths, stripped of EXIF (including GPS, which
 * matters when staff upload straight from a phone), checked by magic bytes, and refused
 * without alt text.
 */

import type { CollectionConfig } from 'payload'
import { anyone, staffOnly } from '../access/roles'
import { assertAllowedUpload } from '../lib/upload-safety'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media file', plural: 'Media library' },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'isPlaceholder', 'updatedAt'],
    group: 'Content',
    description: 'Photographs and graphics used across the website.',
  },
  access: {
    read: anyone,
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
    focalPoint: true,
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
    imageSizes: [
      { name: 'thumbnail', width: 400, height: undefined, withoutEnlargement: true },
      { name: 'small', width: 800, height: undefined, withoutEnlargement: true },
      { name: 'medium', width: 1200, height: undefined, withoutEnlargement: true },
      { name: 'large', width: 1600, height: undefined, withoutEnlargement: true },
      { name: 'xlarge', width: 2400, height: undefined, withoutEnlargement: true },
    ],
    adminThumbnail: 'thumbnail',
    // Drops every metadata block, so GPS coordinates from a phone never reach the web.
    withMetadata: false,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      maxLength: 200,
      admin: {
        description:
          'Describe the picture: [Who] [doing what] [where] at Alliance High School Nansana. Screen readers and Google both use this.',
      },
      validate: (value: string | null | undefined) => {
        if (!value || value.trim().length < 12) {
          return 'Please write a short description of the picture (at least 12 characters).'
        }
        return true
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'Optional caption shown under the picture in galleries.' },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { description: 'Photographer or source, if it should be shown.' },
    },
    {
      name: 'isPlaceholder',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'A temporary stand-in, not a real photograph of the school. Replace it as soon as a real photo exists.',
      },
    },
    {
      name: 'replacementBrief',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.isPlaceholder),
        description: 'The photograph that should replace this one.',
      },
    },
    {
      name: 'blurDataUrl',
      type: 'text',
      admin: { hidden: true },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ req, data }) => {
        // Refuse anything whose contents do not match its claimed type (A08).
        if (req.file) await assertAllowedUpload(req.file, 'image')
        return data
      },
    ],
  },
}
