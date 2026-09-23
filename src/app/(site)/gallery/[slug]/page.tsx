/**
 * A single album (FR-01).
 *
 * A plain responsive grid rather than a lightbox: it costs no JavaScript, and tapping a
 * photograph opens it at full size, which is what a parent on a phone actually wants.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Container, Section, Badge, EmptyState } from '../../../../components/ui'
import { MediaImage, PlaceholderNote, isMedia } from '../../../../components/ui/MediaImage'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../../components/seo/JsonLd'
import { getPayloadClient } from '../../../../lib/payload'
import type { Media } from '../../../../payload-types'

export const revalidate = 3600

interface Params {
  params: Promise<{ slug: string }>
}

async function findAlbum(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'albums',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const albums = await payload.find({
    collection: 'albums',
    where: { _status: { equals: 'published' } },
    limit: 100,
    depth: 0,
  })
  return albums.docs.filter((album) => album.slug).map((album) => ({ slug: album.slug! }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const album = await findAlbum(slug)

  if (!album) return { title: 'Album not found' }

  return {
    title: album.title,
    description:
      album.description ?? `Photographs from ${album.title} at Alliance High School Nansana.`,
    alternates: { canonical: `/gallery/${album.slug}` },
  }
}

export default async function AlbumPage({ params }: Params) {
  const { slug } = await params
  const album = await findAlbum(slug)

  if (!album) notFound()

  const photos = (album.photos ?? []).filter((photo): photo is Media => isMedia(photo as Media))

  return (
    <>
      <PageHeader
        title={album.title}
        lead={album.description}
        image={album.cover}
        trail={[{ name: 'Gallery', href: '/gallery' }]}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: 'Gallery', href: '/gallery' },
          { name: album.title, href: `/gallery/${album.slug}` },
        ]}
      />

      <Section tone="plain">
        <Container>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-maroon-700 hover:text-maroon-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All albums
            </Link>
            {album.year ? <Badge tone="muted">{album.year}</Badge> : null}
          </div>

          {photos.length ? (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <li key={photo.id}>
                  <a
                    href={photo.url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block aspect-square overflow-hidden rounded-[var(--radius-card)]"
                  >
                    <MediaImage
                      media={photo}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    <PlaceholderNote media={photo} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="This album is empty"
              body="Photographs will be added to this album soon."
            />
          )}
        </Container>
      </Section>
    </>
  )
}
