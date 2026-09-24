/**
 * e-Library browse and filter (FR-06, FR-09).
 *
 * The listing is filtered **by the access rule**, not by this query: `loadLibraryShelf`
 * reads with `overrideAccess: false` and no user, so this page only ever shows what a
 * signed-out visitor may see. The subject, class, type and year filters narrow that further.
 *
 * The filters are query-string values, so the page renders per request rather than
 * statically. Downloads go through `/api/files/resource/<id>`, which re-checks access and
 * issues a five-minute signed URL (FR-08). Students find their class material in the
 * portal's library.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { Container, Section, EmptyState, ButtonLink } from '../../../components/ui'
import { ResourceCard } from '../../../components/content/ResourceCard'
import { ResourceFilters } from '../../../components/content/ResourceFilters'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getMediaBySlug, getPayloadClient } from '../../../lib/payload'
import { loadLibraryShelf } from '../../../lib/library'
import { hasFilters, parseResourceFilters } from '../../../lib/resource-filters'

export const metadata: Metadata = {
  title: 'e-Library',
  description:
    'Notes, past papers, textbooks and schemes of work for students of Alliance High School Nansana.',
  alternates: { canonical: '/resources' },
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const payload = await getPayloadClient()
  const filters = parseResourceFilters(await searchParams)

  const [headerImage, shelf] = await Promise.all([
    getMediaBySlug('student-reading-at-a-desk-in-the-school-library-alliance-high-nansana'),
    // No user: the access rule limits this to public items.
    loadLibraryShelf(payload, filters),
  ])

  return (
    <>
      <PageHeader
        title="e-Library"
        lead="Notes, past papers, textbooks and schemes of work, organised by subject and class."
        image={headerImage}
      />
      <BreadcrumbJsonLd trail={[{ name: 'e-Library', href: '/resources' }]} />

      <Section tone="plain">
        <Container>
          <div className="mb-8 flex gap-3 rounded-[var(--radius-card)] border border-gold-300 bg-gold-50 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" aria-hidden />
            <div className="text-sm text-ink-800">
              <p className="font-medium">Students: sign in for your class material</p>
              <p className="mt-1">
                Everything listed here is open to everyone. Notes and past papers for your class
                are in the{' '}
                <Link href="/portal/library" className="font-semibold text-maroon-700 underline">
                  student portal library
                </Link>
                .
              </p>
            </div>
          </div>

          <ResourceFilters
            action="/resources"
            filters={filters}
            subjects={shelf.subjects}
            years={shelf.years}
            total={shelf.total}
          />

          {shelf.resources.length ? (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shelf.resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </ul>
          ) : (
            <div className="mt-8">
              {hasFilters(filters) ? (
                <EmptyState
                  title="Nothing matches these filters"
                  body="Try fewer filters, or clear them to see everything on the shelf."
                />
              ) : (
                <EmptyState
                  title="Nothing published here yet"
                  body="Notes, past papers and textbooks will be listed here as departments upload them."
                />
              )}
            </div>
          )}

          <div className="mt-10 text-center">
            <ButtonLink href="/academics" variant="secondary">
              See the departments
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
