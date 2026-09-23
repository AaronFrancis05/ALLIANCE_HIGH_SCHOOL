/**
 * Server-side access to Payload from React Server Components.
 *
 * `getPayload` is memoised per request by Payload itself; the small wrappers here add
 * React `cache`, so a page that needs the school details three times still queries once.
 */

import { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Config } from '../payload-types'

export const getPayloadClient = cache(async () => getPayload({ config: configPromise }))

type GlobalSlug = keyof Config['globals']

/** Reads a global, returning null rather than throwing if it has never been saved. */
export const getGlobal = cache(async <T extends GlobalSlug>(slug: T): Promise<Config['globals'][T] | null> => {
  const payload = await getPayloadClient()
  try {
    const result = await payload.findGlobal({ slug, depth: 2, overrideAccess: false })
    return result as Config['globals'][T]
  } catch {
    return null
  }
})

export const getSiteSettings = cache(async () => getGlobal('siteSettings'))
export const getNavigation = cache(async () => getGlobal('navigation'))
export const getHomePage = cache(async () => getGlobal('homePage'))
export const getAdmissionsSettings = cache(async () => getGlobal('admissionsSettings'))

/**
 * Finds an image by the file name the image pipeline gave it, so a page can open with a
 * known photograph without an editor having to wire it up first. Returns null when the
 * image is missing, and the caller falls back to a plain brand-coloured header.
 */
export const getMediaBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'media',
    where: { filename: { equals: `${slug}.webp` } },
    limit: 1,
    overrideAccess: false,
  })
  return result.docs[0] ?? null
})
