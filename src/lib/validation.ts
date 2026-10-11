/**
 * Shared Zod schemas for values that arrive from outside: URL segments and uploaded files.
 *
 * Every database query goes through Payload, which binds values as parameters, so these
 * checks are not what stops SQL injection. They are the first gate: a value of the wrong
 * shape is refused before it reaches a query, a storage key or a response header, and the
 * refusal is a plain 404 or 415 instead of a database error.
 */

import { z } from 'zod'

/** A Payload record id in a URL: a positive whole number, nothing else. */
export const recordIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER)

/** A page slug in a URL: the characters `slugify` produces (src/fields/slug.ts). */
export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9-]+$/)

/** The id from a URL, or null when it is not a real id. */
export function parseRecordId(value: unknown): number | null {
  const parsed = recordIdSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

/** The slug from a URL, or null when it is not a real slug. */
export function parseSlug(value: unknown): string | null {
  const parsed = slugSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

/**
 * A file name we are willing to look at. The stored object always gets a random key, but
 * the original name still shows in the admin panel and decides the expected type, so it
 * may not hide a path, a control character or a missing extension.
 */
export const uploadFilenameSchema = z
  .string()
  .min(3)
  .max(255)
  .refine((name) => !/[\u0000-\u001f\u007f]/.test(name), 'The file name contains hidden characters.')
  .refine((name) => !/[\\/]/.test(name), 'The file name may not contain slashes.')
  .refine((name) => /\.[A-Za-z0-9]{1,8}$/.test(name), 'The file name needs an extension, such as .pdf.')

/** An uploaded file as Payload and the admissions form hand it over. */
export const incomingFileSchema = z.object({
  name: uploadFilenameSchema,
  mimetype: z
    .string()
    .max(127)
    .regex(/^[\w.+-]+\/[\w.+-]+$/, 'The file type is not readable.'),
  size: z.number().int().positive('The file is empty.'),
  data: z.instanceof(Buffer),
})

/** Lower-case extension of a file name, without the dot. */
export function fileExtension(name: string): string {
  const match = /\.([A-Za-z0-9]{1,8})$/.exec(name)
  return match ? match[1].toLowerCase() : ''
}
