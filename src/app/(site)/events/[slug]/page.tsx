/**
 * A single event (FR-20).
 *
 * Carries Event structured data so the date and place can appear directly in search
 * results.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { Container, Section, Card, Prose, Badge } from '../../../../components/ui'
import { MediaImage, PlaceholderNote, isMedia } from '../../../../components/ui/MediaImage'
import { formatDate } from '../../../../components/content/PostCard'
import { BreadcrumbJsonLd, EventJsonLd } from '../../../../components/seo/JsonLd'
import { getPayloadClient } from '../../../../lib/payload'
import type { Media } from '../../../../payload-types'

export const revalidate = 600

interface Params {
  params: Promise<{ slug: string }>
}

async function findEvent(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const events = await payload.find({
    collection: 'events',
    where: { _status: { equals: 'published' } },
    limit: 100,
    depth: 0,
  })
  return events.docs.filter((event) => event.slug).map((event) => ({ slug: event.slug! }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const event = await findEvent(slug)

  if (!event) return { title: 'Event not found' }

  return {
    title: event.title,
    description: event.summary ?? undefined,
    alternates: { canonical: `/events/${event.slug}` },
  }
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params
  const event = await findEvent(slug)

  if (!event) notFound()

  const image = event.image as Media | undefined

  return (
    <>
      <EventJsonLd
        name={event.title}
        description={event.summary ?? ''}
        startDate={event.startDate}
        endDate={event.endDate ?? undefined}
        location={event.location ?? undefined}
        slug={event.slug ?? slug}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: 'Events', href: '/events' },
          { name: event.title, href: `/events/${event.slug}` },
        ]}
      />

      <Section tone="plain">
        <Container className="max-w-3xl">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-maroon-700 hover:text-maroon-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All events
          </Link>

          <h1 className="mt-6 text-3xl sm:text-4xl">{event.title}</h1>
          {event.summary ? (
            <p className="mt-4 text-lg text-[var(--text-muted)]">{event.summary}</p>
          ) : null}

          <Card className="mt-8 p-6">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-maroon-700">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  When
                </dt>
                <dd className="mt-1 text-sm text-[var(--text-body)]">
                  <time dateTime={event.startDate}>{formatDate(event.startDate)}</time>
                  {event.endDate && event.endDate !== event.startDate ? (
                    <>
                      {' to '}
                      <time dateTime={event.endDate}>{formatDate(event.endDate)}</time>
                    </>
                  ) : null}
                </dd>
              </div>

              {event.location ? (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-maroon-700">
                    <MapPin className="h-4 w-4" aria-hidden />
                    Where
                  </dt>
                  <dd className="mt-1 text-sm text-[var(--text-body)]">{event.location}</dd>
                </div>
              ) : null}

              {event.audience ? (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-maroon-700">
                    <Users className="h-4 w-4" aria-hidden />
                    Who
                  </dt>
                  <dd className="mt-1">
                    <Badge tone="muted">{event.audience}</Badge>
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>
        </Container>
      </Section>

      {isMedia(image) ? (
        <Container className="max-w-4xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)]">
            <MediaImage media={image} sizes="(max-width: 1024px) 100vw, 56rem" />
            <PlaceholderNote media={image} />
          </div>
        </Container>
      ) : null}

      {event.body ? (
        <Section tone="plain">
          <Container className="max-w-3xl">
            <Prose>
              <RichText data={event.body} />
            </Prose>
          </Container>
        </Section>
      ) : null}
    </>
  )
}
