/**
 * The school diary (FR-20).
 *
 * Upcoming events first, then what has already happened this year, so a parent landing
 * here from a search result is not left wondering whether the page is stale.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { Container, Card, Section, SectionHeading, EmptyState, Badge } from '../../../components/ui'
import { PageHeader } from '../../../components/layout/PageHeader'
import { formatDate } from '../../../components/content/PostCard'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getMediaBySlug, getPayloadClient } from '../../../lib/payload'
import type { Event } from '../../../payload-types'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Term dates, visiting days, sports days and other events at Alliance High School Nansana.',
  alternates: { canonical: '/events' },
}

function EventCard({ event, past = false }: { event: Event; past?: boolean }) {
  return (
    <Card as="li" className={`p-6 ${past ? 'opacity-75' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-2 text-xs font-medium text-maroon-700">
          <CalendarDays className="h-4 w-4" aria-hidden />
          <time dateTime={event.startDate}>{formatDate(event.startDate)}</time>
        </p>
        {event.audience ? <Badge tone="muted">{event.audience}</Badge> : null}
      </div>

      <h3 className="mt-2 font-display text-lg">
        <Link href={`/events/${event.slug}`} className="hover:text-maroon-700">
          {event.title}
        </Link>
      </h3>

      {event.summary ? (
        <p className="mt-1 line-clamp-3 text-sm text-[var(--text-muted)]">{event.summary}</p>
      ) : null}

      <div className="mt-3 space-y-1">
        {event.location ? (
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {event.location}
          </p>
        ) : null}
        {event.audience ? (
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {event.audience}
          </p>
        ) : null}
      </div>
    </Card>
  )
}

export default async function EventsPage() {
  const payload = await getPayloadClient()
  const now = new Date().toISOString()

  const [headerImage, upcoming, past] = await Promise.all([
    getMediaBySlug('students-on-the-main-driveway-alliance-high-nansana'),
    payload.find({
      collection: 'events',
      where: { and: [{ _status: { equals: 'published' } }, { startDate: { greater_than: now } }] },
      sort: 'startDate',
      limit: 30,
      depth: 1,
    }),
    payload.find({
      collection: 'events',
      where: { and: [{ _status: { equals: 'published' } }, { startDate: { less_than: now } }] },
      sort: '-startDate',
      limit: 9,
      depth: 1,
    }),
  ])

  return (
    <>
      <PageHeader
        title="Events"
        lead="Term dates, visiting days and everything else in the school diary."
        image={headerImage}
      />
      <BreadcrumbJsonLd trail={[{ name: 'Events', href: '/events' }]} />

      <Section tone="plain">
        <Container>
          <SectionHeading eyebrow="Diary" title="Coming up" align="left" />
          {upcoming.docs.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.docs.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nothing scheduled at the moment"
              body="Term dates and events will appear here as soon as they are confirmed."
            />
          )}
        </Container>
      </Section>

      {past.docs.length ? (
        <Section tone="sunken">
          <Container>
            <SectionHeading eyebrow="Already happened" title="Earlier this year" align="left" />
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.docs.map((event) => (
                <EventCard key={event.id} event={event} past />
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </>
  )
}
