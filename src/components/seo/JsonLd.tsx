/**
 * Structured data (FR-24, P6-T1).
 *
 * This is what produces the rich Google result: the school's name, address, phone and
 * links in a knowledge panel, breadcrumbs under the link, and news and events shown as
 * cards. Google also needs a verified Google Business Profile; see docs/SEO.md.
 */

import React from 'react'
import { env } from '../../lib/env'
import type { SiteSetting } from '../../payload-types'

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The content is built from our own CMS data, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function OrganisationJsonLd({ settings }: { settings: SiteSetting | null }) {
  const name = settings?.schoolName ?? 'Alliance High School Nansana'
  const address = settings?.address

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HighSchool',
    '@id': `${env.siteUrl}/#school`,
    name,
    alternateName: settings?.shortName ?? undefined,
    url: env.siteUrl,
    logo: `${env.siteUrl}/brand/crest.png`,
    image: `${env.siteUrl}/brand/crest.png`,
    slogan: settings?.motto ?? undefined,
    description: settings?.mission ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address?.line1 ?? 'Nansana',
      addressLocality: 'Nansana',
      addressRegion: address?.district ?? 'Wakiso District',
      addressCountry: 'UG',
      postOfficeBoxNumber: address?.poBox ?? undefined,
    },
    telephone: settings?.phones?.[0]?.number,
    email: settings?.emails?.[0]?.address,
    sameAs: settings?.social?.map((entry) => entry.url) ?? [],
  }

  if (address?.latitude && address?.longitude) {
    data.geo = {
      '@type': 'GeoCoordinates',
      latitude: address.latitude,
      longitude: address.longitude,
    }
  }

  // Only claim a founding date once the school has confirmed one.
  const founded = settings?.foundedYear
  if (founded && /^\d{4}$/.test(founded)) data.foundingDate = founded

  return <JsonLd data={data} />
}

export function BreadcrumbJsonLd({ trail }: { trail: { name: string; href: string }[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [{ name: 'Home', href: '/' }, ...trail].map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${env.siteUrl}${item.href}`,
        })),
      }}
    />
  )
}

export function ArticleJsonLd({
  title,
  description,
  imageUrl,
  publishedAt,
  updatedAt,
  slug,
  authorName,
}: {
  title: string
  description: string
  imageUrl?: string
  publishedAt: string
  updatedAt?: string
  slug: string
  authorName?: string
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: title.slice(0, 110),
        description,
        image: imageUrl ? [imageUrl] : undefined,
        datePublished: publishedAt,
        dateModified: updatedAt ?? publishedAt,
        author: { '@type': authorName ? 'Person' : 'Organization', name: authorName ?? 'Alliance High School Nansana' },
        publisher: { '@id': `${env.siteUrl}/#school` },
        mainEntityOfPage: `${env.siteUrl}/news/${slug}`,
      }}
    />
  )
}

export function EventJsonLd({
  name,
  description,
  startDate,
  endDate,
  location,
  imageUrl,
  slug,
}: {
  name: string
  description: string
  startDate: string
  endDate?: string | null
  /** Where on campus. Defaults to the school itself when an event does not say. */
  location?: string | null
  imageUrl?: string
  slug: string
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Event',
        name,
        description,
        startDate,
        endDate: endDate ?? undefined,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: location || 'Alliance High School Nansana',
          address: { '@type': 'PostalAddress', addressLocality: 'Nansana', addressCountry: 'UG' },
        },
        image: imageUrl ? [imageUrl] : undefined,
        organizer: { '@id': `${env.siteUrl}/#school` },
        url: `${env.siteUrl}/events/${slug}`,
      }}
    />
  )
}

export function FaqJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  if (!items.length) return null

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }}
    />
  )
}

export function VideoJsonLd({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  youtubeId,
}: {
  name: string
  description: string
  thumbnailUrl: string
  uploadDate: string
  youtubeId: string
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name,
        description,
        thumbnailUrl: [thumbnailUrl],
        uploadDate,
        embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      }}
    />
  )
}
