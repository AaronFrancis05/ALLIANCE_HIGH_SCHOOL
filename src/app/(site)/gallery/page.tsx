/**
 * Photo gallery index (FR-01).
 *
 * Albums are covered images that link through to the full set. Every tile has fixed
 * dimensions and a blur placeholder, so the grid never collapses while loading — the
 * flaw on the reference site this replaces.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, EmptyState, Badge } from '../../../components/ui'
import { MediaImage, PlaceholderNote } from '../../../components/ui/MediaImage'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getMediaBySlug, getPayloadClient } from '../../../lib/payload'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photographs of learning, sport, clubs and campus life at Alliance High School Nansana.',
  alternates: { canonical: '/gallery' },
}

export default async function GalleryPage() {
  const payload = await getPayloadClient()

  const [headerImage, albums] = await Promise.all([
    getMediaBySlug('students-walking-to-class-with-books-alliance-high-nansana'),
    payload.find({
      collection: 'albums',
      where: { _status: { equals: 'published' } },
      sort: '-year',
      limit: 48,
      depth: 2,
    }),
  ])

  return (
    <>
      <PageHeader
        title="Gallery"
        lead="Life at Alliance High School Nansana, in pictures."
        image={headerImage}
      />
      <BreadcrumbJsonLd trail={[{ name: 'Gallery', href: '/gallery' }]} />

      <Section tone="plain">
        <Container>
          {albums.docs.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {albums.docs.map((album) => (
                <Link
                  key={album.id}
                  href={`/gallery/${album.slug}`}
                  className="group block overflow-hidden rounded-[var(--radius-card)] border border-cream-300 bg-[var(--surface-raised)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <MediaImage
                      media={album.cover}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    <PlaceholderNote media={album.cover} />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {album.year ? <Badge tone="muted">{album.year}</Badge> : null}
                      <span className="text-xs text-[var(--text-muted)]">
                        {album.photos?.length ?? 0} photograph
                        {(album.photos?.length ?? 0) === 1 ? '' : 's'}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-lg group-hover:text-maroon-700">
                      {album.title}
                    </h2>
                    {album.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                        {album.description}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No albums yet"
              body="Photographs of school events will be published here."
            />
          )}
        </Container>
      </Section>
    </>
  )
}
