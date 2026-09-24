/**
 * XML sitemap (FR-24).
 *
 * Lists the fixed pages plus every published post, event and album, so a new article is
 * discoverable without waiting for Google to crawl its way to it. The student portal and
 * the admin panel are deliberately absent — they are noindex.
 */

import type { MetadataRoute } from 'next'
import { getPayloadClient } from '../lib/payload'
import { env } from '../lib/env'

/** Recomputed daily; publishing also revalidates the affected pages. */
export const revalidate = 86400

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] =
  [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/about/leadership', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/about/staff', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/academics', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/admissions', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/admissions/fees', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/admissions/apply', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/admissions/track', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/student-life', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/news', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/events', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/gallery', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/resources', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl.replace(/\/$/, '')

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: `${base}${entry.path}`,
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))

  try {
    const payload = await getPayloadClient()
    const published = { _status: { equals: 'published' } }

    const [posts, events, albums] = await Promise.all([
      payload.find({ collection: 'posts', where: published, limit: 500, depth: 0 }),
      payload.find({ collection: 'events', where: published, limit: 500, depth: 0 }),
      payload.find({ collection: 'albums', where: published, limit: 500, depth: 0 }),
    ])

    for (const post of posts.docs) {
      if (!post.slug) continue
      entries.push({
        url: `${base}/news/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }

    for (const event of events.docs) {
      if (!event.slug) continue
      entries.push({
        url: `${base}/events/${event.slug}`,
        lastModified: new Date(event.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }

    for (const album of albums.docs) {
      if (!album.slug) continue
      entries.push({
        url: `${base}/gallery/${album.slug}`,
        lastModified: new Date(album.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.4,
      })
    }
  } catch {
    // A database hiccup must not produce an empty sitemap; the fixed pages still ship.
  }

  return entries
}
