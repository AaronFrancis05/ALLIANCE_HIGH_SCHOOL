/**
 * Student life (FR-01).
 *
 * Clubs, sport and boarding, with the events diary pulled from the CMS.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, MapPin, Music, Trophy, Users, BedDouble } from 'lucide-react'
import { Container, Card, Section, SectionHeading, ButtonLink, EmptyState } from '../../../components/ui'
import { MediaImage, PlaceholderNote } from '../../../components/ui/MediaImage'
import { PageHeader } from '../../../components/layout/PageHeader'
import { formatDate } from '../../../components/content/PostCard'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getMediaBySlug, getPayloadClient } from '../../../lib/payload'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Student life',
  description:
    'Clubs, societies, sport and boarding at Alliance High School Nansana — what students do beyond the classroom.',
  alternates: { canonical: '/student-life' },
}

export default async function StudentLifePage() {
  const payload = await getPayloadClient()

  const [headerImage, clubsImage, sportImage, boardingImage, events] = await Promise.all([
    getMediaBySlug('students-heading-to-the-library-alliance-high-nansana'),
    getMediaBySlug('students-reading-magazines-in-the-journalism-club-alliance-high-nansana'),
    getMediaBySlug('placeholder-football-match-alliance-high-nansana'),
    getMediaBySlug('placeholder-dining-hall-alliance-high-nansana'),
    payload.find({
      collection: 'events',
      where: {
        and: [{ _status: { equals: 'published' } }, { startDate: { greater_than: new Date().toISOString() } }],
      },
      sort: 'startDate',
      limit: 6,
      depth: 1,
    }),
  ])

  const areas = [
    {
      id: 'clubs',
      icon: Users,
      title: 'Clubs and societies',
      body: 'Debate, journalism, writers, science and scripture union meet weekly. Every student is expected to belong to at least one, because a school is more than its timetable.',
      image: clubsImage,
    },
    {
      id: 'sports',
      icon: Trophy,
      title: 'Sport',
      body: 'Football, netball, volleyball and athletics, with inter-house competition each term and school teams in the district league.',
      image: sportImage,
    },
    {
      id: 'boarding',
      icon: BedDouble,
      title: 'Boarding',
      body: 'Boarders are supervised by resident matrons and patrons, with set preparation hours each evening and a weekend routine that mixes study, sport and rest.',
      image: boardingImage,
    },
  ]

  return (
    <>
      <PageHeader
        title="Student life"
        lead="What happens between the lessons."
        image={headerImage}
      />
      <BreadcrumbJsonLd trail={[{ name: 'Student life', href: '/student-life' }]} />

      <Section tone="plain">
        <Container>
          <div className="space-y-16">
            {areas.map((area, index) => (
              <div
                key={area.id}
                id={area.id}
                className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : undefined}>
                  <area.icon className="h-8 w-8 text-maroon-700" aria-hidden />
                  <h2 className="mt-3 text-2xl sm:text-3xl">{area.title}</h2>
                  <p className="mt-3 text-[var(--text-body)]">{area.body}</p>
                </div>
                <div
                  className={`relative aspect-[3/2] overflow-hidden rounded-[var(--radius-card)] ${
                    index % 2 === 1 ? 'lg:order-1' : ''
                  }`}
                >
                  <MediaImage media={area.image} sizes="(max-width: 1024px) 100vw, 50vw" />
                  <PlaceholderNote media={area.image} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="sunken" id="music">
        <Container>
          <SectionHeading
            eyebrow="Music, dance and drama"
            title="A term ends with a performance"
            lead="Traditional dance, choir and drama are rehearsed weekly and performed for the whole school."
          />
          <div className="text-center">
            <ButtonLink href="/gallery" variant="secondary">
              See the gallery
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section tone="plain" id="diary">
        <Container>
          <SectionHeading eyebrow="Diary" title="What is coming up" />

          {events.docs.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.docs.map((event) => (
                <Card as="li" key={event.id} className="p-6">
                  <p className="flex items-center gap-2 text-xs font-medium text-maroon-700">
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    <time dateTime={event.startDate}>{formatDate(event.startDate)}</time>
                  </p>
                  <h3 className="mt-2 font-display text-lg">
                    <Link href={`/events/${event.slug}`} className="hover:text-maroon-700">
                      {event.title}
                    </Link>
                  </h3>
                  {event.summary ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{event.summary}</p>
                  ) : null}
                  {event.location ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {event.location}
                    </p>
                  ) : null}
                </Card>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nothing in the diary yet"
              body="Term dates, sports days and visiting days will be listed here."
            />
          )}
        </Container>
      </Section>

      <Section tone="brand" className="py-14">
        <Container className="text-center">
          <Music className="mx-auto h-9 w-9 text-gold-300" aria-hidden />
          <h2 className="mt-4 text-3xl text-white">Come and see for yourself</h2>
          <p className="mx-auto mt-3 max-w-2xl text-cream-200">
            Visit on a weekday and watch a lesson, a rehearsal or an afternoon game.
          </p>
          <div className="mt-7">
            <ButtonLink href="/contact" variant="accent" className="min-h-12 px-8">
              Arrange a visit
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
