/**
 * News listing (FR-01, FR-04).
 *
 * Only published posts are read, and the access rule enforces that rather than this query.
 */

import React from 'react'
import type { Metadata } from 'next'
import { Container, Section, EmptyState } from '../../../components/ui'
import { PostCard } from '../../../components/content/PostCard'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getMediaBySlug, getPayloadClient } from '../../../lib/payload'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'News',
  description: 'News, announcements and stories from Alliance High School Nansana.',
  alternates: { canonical: '/news' },
}

export default async function NewsPage() {
  const payload = await getPayloadClient()

  const [headerImage, posts] = await Promise.all([
    getMediaBySlug('students-in-a-group-discussion-under-the-trees-alliance-high-nansana'),
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 24,
      depth: 2,
    }),
  ])

  return (
    <>
      <PageHeader
        title="News"
        lead="What is happening at school, as it happens."
        image={headerImage}
      />
      <BreadcrumbJsonLd trail={[{ name: 'News', href: '/news' }]} />

      <Section tone="plain">
        <Container>
          {posts.docs.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        </Container>
      </Section>
    </>
  )
}
