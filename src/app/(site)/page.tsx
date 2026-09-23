/**
 * Home page.
 *
 * Statically generated and revalidated when an editor publishes, so it is fast on 4G
 * (NFR-01, NFR-02). Everything on it comes from the CMS.
 */

import React from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { Container, ButtonLink, Card, Section, SectionHeading, EmptyState } from '../../components/ui'
import { Hero } from '../../components/home/Hero'
import { IdentityCards } from '../../components/home/IdentityCards'
import { Welcome } from '../../components/home/Welcome'
import { Stats } from '../../components/home/Stats'
import { Features } from '../../components/home/Features'
import { Testimonials } from '../../components/home/Testimonials'
import { PostCard, formatDate } from '../../components/content/PostCard'
import { MediaImage, PlaceholderNote } from '../../components/ui/MediaImage'
import { getHomePage, getPayloadClient, getSiteSettings } from '../../lib/payload'
import type { Media } from '../../payload-types'

export const revalidate = 3600

export default async function HomePageRoute() {
  const payload = await getPayloadClient()
  const [settings, home, posts, events, albums, testimonials] = await Promise.all([
    getSiteSettings(),
    getHomePage(),
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 3,
      depth: 2,
    }),
    payload.find({
      collection: 'events',
      where: { and: [{ _status: { equals: 'published' } }, { startDate: { greater_than: new Date().toISOString() } }] },
      sort: 'startDate',
      limit: 3,
    }),
    payload.find({
      collection: 'albums',
      where: { _status: { equals: 'published' } },
      sort: '-year',
      limit: 6,
      depth: 2,
    }),
    payload.find({ collection: 'testimonials', where: { featured: { equals: true } }, limit: 3, depth: 2 }),
  ])

  const heroSlides = (home?.hero ?? []).map((slide) => ({
    headline: slide.headline,
    subhead: slide.subhead,
    image: slide.image as Media,
    buttonLabel: slide.buttonLabel,
    buttonHref: slide.buttonHref,
  }))

  return (
    <>
      {heroSlides.length ? <Hero slides={heroSlides} /> : null}

      <IdentityCards
        vision={settings?.vision}
        mission={settings?.mission}
        coreValues={settings?.coreValues}
        theme={settings?.themeOfTheYear}
      />

      {home?.welcome?.name && home.welcome.message ? (
        <Welcome
          heading={home.welcome.heading}
          name={home.welcome.name}
          title={home.welcome.title}
          message={home.welcome.message}
          photo={home.welcome.photo as Media}
          readMoreHref={home.welcome.readMoreHref}
        />
      ) : null}

      <Stats stats={settings?.stats ?? []} />

      <Features
        features={(home?.features ?? []).map((feature) => ({
          title: feature.title,
          body: feature.body,
          icon: feature.icon as 'book' | 'flask' | 'trophy' | 'users' | 'heart' | 'star',
          image: feature.image as Media,
        }))}
      />

      {/* News and upcoming events, side by side on desktop */}
      <Section tone="plain">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div>
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-widest text-maroon-700 uppercase">
                    Latest news
                  </p>
                  <h2 className="text-3xl">What is happening at school</h2>
                </div>
                <Link
                  href="/news"
                  className="hidden shrink-0 items-center gap-1 text-sm font-medium text-maroon-700 hover:text-maroon-900 sm:flex"
                >
                  All news <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              {posts.docs.length ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {posts.docs.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No news posted yet"
                  body="School news and stories will appear here as soon as they are published."
                />
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-widest text-maroon-700 uppercase">Diary</p>
              <h2 className="mb-8 text-3xl">Upcoming events</h2>

              {events.docs.length ? (
                <ul className="space-y-4">
                  {events.docs.map((event) => (
                    <Card as="li" key={event.id} className="p-5">
                      <p className="flex items-center gap-2 text-xs font-medium text-maroon-700">
                        <CalendarDays className="h-4 w-4" aria-hidden />
                        <time dateTime={event.startDate}>{formatDate(event.startDate)}</time>
                      </p>
                      <h3 className="mt-2 font-display text-lg">
                        <Link href={`/events/${event.slug}`} className="hover:text-maroon-700">
                          {event.title}
                        </Link>
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{event.summary}</p>
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
                <EmptyState title="Nothing in the diary" body="Term dates and events will be listed here." />
              )}

              <ButtonLink href="/events" variant="secondary" className="mt-6 w-full">
                See the calendar
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      {/* Gallery strip */}
      {albums.docs.length ? (
        <Section tone="sunken">
          <Container>
            <SectionHeading
              eyebrow="Gallery"
              title="Life at Alliance High School Nansana"
              lead="A look at learning, sport and celebration on our campus."
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {albums.docs.map((album) => (
                <Link
                  key={album.id}
                  href={`/gallery/${album.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-[var(--radius-card)]"
                >
                  <MediaImage
                    media={album.cover}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="transition-transform duration-500 group-hover:scale-110"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3 text-xs font-medium text-white">
                    {album.title}
                  </span>
                  <PlaceholderNote media={album.cover} />
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <ButtonLink href="/gallery" variant="secondary">
                Open the gallery
              </ButtonLink>
            </div>
          </Container>
        </Section>
      ) : null}

      <Testimonials testimonials={testimonials.docs} />

      {/* Closing call to action */}
      <Section tone="brand" className="py-16">
        <Container className="text-center">
          <h2 className="text-3xl text-white sm:text-4xl">
            {home?.callToAction?.heading ?? 'Join our school community'}
          </h2>
          {home?.callToAction?.body ? (
            <p className="mx-auto mt-4 max-w-2xl text-cream-200">{home.callToAction.body}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <ButtonLink
              href={home?.callToAction?.buttonHref ?? '/admissions'}
              variant="accent"
              className="min-h-12 px-8"
            >
              {home?.callToAction?.buttonLabel ?? 'Start your application'}
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="secondary"
              className="min-h-12 border-white px-8 text-white hover:bg-white hover:text-maroon-800"
            >
              Arrange a visit
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
