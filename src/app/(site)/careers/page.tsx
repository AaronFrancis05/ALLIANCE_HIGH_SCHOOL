/**
 * Working at the school: the posts open now, and a way to ask about work when none fits.
 *
 * Vacancies come from the CMS; a post drops off this list the day after its closing date.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Briefcase, CalendarClock } from 'lucide-react'
import { Container, Card, Section, SectionHeading, EmptyState, Badge } from '../../../components/ui'
import { PageHeader } from '../../../components/layout/PageHeader'
import { formatDate } from '../../../components/content/PostCard'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { EnquiryForm } from '../../../components/contact/EnquiryForm'
import { getMediaBySlug, getPayloadClient } from '../../../lib/payload'
import { EMPLOYMENT_LABELS, openVacancyCutoff } from '../../../lib/vacancies'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Teaching and support posts open at Alliance High School Nansana, and how to apply.',
  alternates: { canonical: '/careers' },
}

export default async function CareersPage() {
  const payload = await getPayloadClient()

  const [headerImage, vacancies] = await Promise.all([
    getMediaBySlug('students-on-the-main-driveway-alliance-high-nansana'),
    payload.find({
      collection: 'vacancies',
      where: {
        and: [
          { _status: { equals: 'published' } },
          {
            or: [
              { closingDate: { exists: false } },
              { closingDate: { greater_than_equal: openVacancyCutoff() } },
            ],
          },
        ],
      },
      sort: 'closingDate',
      limit: 50,
      depth: 0,
    }),
  ])

  return (
    <>
      <PageHeader title="Careers" lead="Teaching and support posts open at the school." image={headerImage} />
      <BreadcrumbJsonLd trail={[{ name: 'Careers', href: '/careers' }]} />

      <Section tone="plain">
        <Container>
          <SectionHeading eyebrow="Vacancies" title="Posts open now" align="left" />
          {vacancies.docs.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vacancies.docs.map((vacancy) => (
                <Card as="li" key={vacancy.id} className="p-6">
                  <Badge tone="muted">{EMPLOYMENT_LABELS[vacancy.employment] ?? vacancy.employment}</Badge>
                  <h3 className="mt-2 font-display text-lg" data-testid="vacancy">
                    <Link href={`/careers/${vacancy.slug}`} className="hover:text-maroon-700">
                      {vacancy.title}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-3 text-sm text-[var(--text-muted)]">{vacancy.summary}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                    {vacancy.closingDate ? (
                      <>
                        Closes <time dateTime={vacancy.closingDate}>{formatDate(vacancy.closingDate)}</time>
                      </>
                    ) : (
                      'Open until filled'
                    )}
                  </p>
                </Card>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No posts open at the moment"
              body="New vacancies are listed here as soon as they are advertised. You are welcome to write to the school below in the meantime."
            />
          )}
        </Container>
      </Section>

      <Section tone="sunken" id="enquiry">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Ask about working here"
            title="Write to the school"
            lead="Tell the office what kind of post you are looking for. They will reply using the details you give."
          />
          <div className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
            <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-maroon-700" aria-hidden />
            <p>Please do not send certificates or identity documents through this form.</p>
          </div>
          <div className="mt-6">
            <EnquiryForm preset={{ form: 'careers' }} />
          </div>
        </Container>
      </Section>
    </>
  )
}
