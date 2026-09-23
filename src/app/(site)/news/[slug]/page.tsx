/**
 * A single news article (FR-04, FR-24).
 *
 * Statically generated per published post, with Article structured data so Google can
 * show the headline, date and image.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { Container, Section, Badge, Prose } from '../../../../components/ui'
import { MediaImage, PlaceholderNote, isMedia } from '../../../../components/ui/MediaImage'
import { PostCard, formatDate } from '../../../../components/content/PostCard'
import { ArticleJsonLd, BreadcrumbJsonLd } from '../../../../components/seo/JsonLd'
import { getPayloadClient } from '../../../../lib/payload'
import type { Category, Media } from '../../../../payload-types'

export const revalidate = 600

interface Params {
  params: Promise<{ slug: string }>
}

async function findPost(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const posts = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit: 100,
    depth: 0,
  })
  return posts.docs.filter((post) => post.slug).map((post) => ({ slug: post.slug! }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = await findPost(slug)

  if (!post) return { title: 'Article not found' }

  const cover = post.coverImage as Media | undefined

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt ?? undefined,
      publishedTime: post.publishedAt ?? undefined,
      images: isMedia(cover) && cover.url ? [{ url: cover.url }] : undefined,
    },
  }
}

export default async function NewsArticlePage({ params }: Params) {
  const { slug } = await params
  const post = await findPost(slug)

  if (!post) notFound()

  const payload = await getPayloadClient()
  const more = await payload.find({
    collection: 'posts',
    where: { and: [{ _status: { equals: 'published' } }, { id: { not_equals: post.id } }] },
    sort: '-publishedAt',
    limit: 3,
    depth: 2,
  })

  const cover = post.coverImage as Media | undefined
  const category = post.category as Category | undefined

  return (
    <>
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt ?? ''}
        publishedAt={post.publishedAt ?? undefined}
        imageUrl={isMedia(cover) ? (cover.url ?? undefined) : undefined}
        slug={post.slug ?? slug}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: 'News', href: '/news' },
          { name: post.title, href: `/news/${post.slug}` },
        ]}
      />

      <article>
        <Section tone="plain" className="pb-0">
          <Container className="max-w-3xl">
            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-maroon-700 hover:text-maroon-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All news
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {category?.name ? <Badge tone="maroon">{category.name}</Badge> : null}
              {post.publishedAt ? (
                <span className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl">{post.title}</h1>
            {post.excerpt ? (
              <p className="mt-4 text-lg text-[var(--text-muted)]">{post.excerpt}</p>
            ) : null}
          </Container>
        </Section>

        {isMedia(cover) ? (
          <Container className="max-w-4xl">
            <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[var(--radius-card)]">
              <MediaImage media={cover} priority sizes="(max-width: 1024px) 100vw, 56rem" />
              <PlaceholderNote media={cover} />
            </div>
          </Container>
        ) : null}

        <Section tone="plain">
          <Container className="max-w-3xl">
            {post.body ? (
              <Prose>
                <RichText data={post.body} />
              </Prose>
            ) : null}
          </Container>
        </Section>
      </article>

      {more.docs.length ? (
        <Section tone="sunken">
          <Container>
            <h2 className="mb-8 text-2xl">More from the school</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.docs.map((item) => (
                <PostCard key={item.id} post={item} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  )
}
