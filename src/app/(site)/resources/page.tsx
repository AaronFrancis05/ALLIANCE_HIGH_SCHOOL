/**
 * e-Library browse (FR-06, FR-09).
 *
 * The listing is filtered **by the access rule**, not by this query: `overrideAccess:
 * false` makes Payload apply `readResources`, so a signed-out visitor sees public items
 * only and a restricted item can never appear here by accident.
 *
 * Downloading is deliberately not wired up yet. Files live in the private bucket and must
 * be served through a route that re-checks the session and issues a five-minute signed URL
 * (FR-08, P3-T3). Until that route and the student sign-in exist, this page lists what is
 * available rather than exposing a storage key.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, FileText, GraduationCap, Info, Layers, Video } from 'lucide-react'
import { Container, Card, Section, Badge, EmptyState, ButtonLink } from '../../../components/ui'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getMediaBySlug, getPayloadClient } from '../../../lib/payload'
import { CLASS_LABELS, type SchoolClass } from '../../../access/resources'
import type { Subject } from '../../../payload-types'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'e-Library',
  description:
    'Notes, past papers, textbooks and schemes of work for students of Alliance High School Nansana.',
  alternates: { canonical: '/resources' },
}

const TYPE_LABELS: Record<string, string> = {
  notes: 'Notes',
  pastPaper: 'Past paper',
  textbook: 'Textbook',
  scheme: 'Scheme of work',
  video: 'Video lesson',
  other: 'Other',
}

const TYPE_ICONS: Record<string, typeof BookOpen> = {
  notes: FileText,
  pastPaper: GraduationCap,
  textbook: BookOpen,
  scheme: Layers,
  video: Video,
  other: FileText,
}

function formatSize(bytes?: number | null): string | null {
  if (!bytes) return null
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
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
              <p className="font-medium">Signing in shows more</p>
              <p className="mt-1">
                Anything listed below is open to everyone. Notes and past papers restricted to a
                class are released through the student portal, which opens with student sign-in.
              </p>
            </div>
          </div>

          {resources.docs.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resources.docs.map((resource) => {
                const Icon = TYPE_ICONS[resource.type] ?? FileText
                const subject = resource.subject as Subject | undefined
                const size = formatSize(resource.filesize)

                return (
                  <Card as="li" key={resource.id} className="flex flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <Icon className="h-7 w-7 shrink-0 text-maroon-700" aria-hidden />
                      <Badge tone="muted">{TYPE_LABELS[resource.type] ?? resource.type}</Badge>
                    </div>

                    <h2 className="mt-4 font-display text-lg">{resource.title}</h2>
                    {resource.description ? (
                      <p className="mt-2 line-clamp-3 text-sm text-[var(--text-body)]">
                        {resource.description}
                      </p>
                    ) : null}

                    <dl className="mt-4 space-y-1 text-xs text-[var(--text-muted)]">
                      {typeof subject === 'object' && subject?.name ? (
                        <div className="flex gap-1">
                          <dt className="font-medium">Subject:</dt>
                          <dd>{subject.name}</dd>
                        </div>
                      ) : null}
                      {resource.classes?.length ? (
                        <div className="flex gap-1">
                          <dt className="font-medium">For:</dt>
                          <dd>
                            {(resource.classes as SchoolClass[])
                              .map((entry) => CLASS_LABELS[entry] ?? entry)
                              .join(', ')}
                          </dd>
                        </div>
                      ) : null}
                      {resource.year ? (
                        <div className="flex gap-1">
                          <dt className="font-medium">Year:</dt>
                          <dd>{resource.year}</dd>
                        </div>
                      ) : null}
                      {size ? (
                        <div className="flex gap-1">
                          <dt className="font-medium">Size:</dt>
                          <dd>{size}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="mt-5 pt-1">
                      {resource.externalUrl ? (
                        <Link
                          href={resource.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center text-sm font-semibold text-maroon-700 hover:text-maroon-900"
                        >
                          Open the link →
                        </Link>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">
                          Downloading opens with the student portal
                        </span>
                      )}
                    </div>
                  </Card>
                )
              })}
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
