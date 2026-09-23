/**
 * e-Library browse (FR-06, FR-09).
 *
 * The listing is filtered **by the access rule**, not by this query: `overrideAccess:
 * false` makes Payload apply `readResources`, so a signed-out visitor sees public items
 * only and a restricted item can never appear here by accident.
 *
 * This page is static, so it only ever shows what a signed-out visitor may see. Downloads
 * go through `/api/files/resource/<id>`, which re-checks access and issues a five-minute
 * signed URL (FR-08). Students find their class material in the portal's library.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { Container, Section, EmptyState, ButtonLink } from '../../../components/ui'
import { ResourceCard } from '../../../components/content/ResourceCard'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getMediaBySlug, getPayloadClient } from '../../../lib/payload'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'e-Library',
  description:
    'Notes, past papers, textbooks and schemes of work for students of Alliance High School Nansana.',
  alternates: { canonical: '/resources' },
}

export default async function ResourcesPage() {
  const payload = await getPayloadClient()

  const [headerImage, resources] = await Promise.all([
    getMediaBySlug('student-reading-at-a-desk-in-the-school-library-alliance-high-nansana'),
    payload.find({
      collection: 'resources',
      sort: '-createdAt',
      limit: 60,
      depth: 2,
      // The access rule decides what is visible. Never pass true here.
      overrideAccess: false,
    }),
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

          {resources.docs.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resources.docs.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nothing published here yet"
              body="Notes, past papers and textbooks will be listed here as departments upload them."
            />
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
