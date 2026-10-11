/**
 * robots.txt (FR-24, NFR-05).
 *
 * The admin panel, the student and staff portals and the API are kept out of search results. They are
 * also protected by access rules. This is about not advertising them, not about security.
 */

import type { MetadataRoute } from 'next'
import { env } from '../lib/env'

export default function robots(): MetadataRoute.Robots {
  const base = env.siteUrl.replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/portal', '/portal/', '/staff', '/staff/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
