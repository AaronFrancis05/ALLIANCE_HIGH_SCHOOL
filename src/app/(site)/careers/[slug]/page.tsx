/**
 * A single vacancy, with the enquiry form already set to this post.
 *
 * After the closing date the page stays up and says so, rather than turning into a 404
 * for someone following a shared link.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Briefcase, CalendarClock } from 'lucide-react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { Container, Section, Card, Prose, SectionHeading } from '../../../../components/ui'
import { formatDate } from '../../../../components/content/PostCard'
import { BreadcrumbJsonLd } from '../../../../components/seo/JsonLd'
import { EnquiryForm } from '../../../../components/contact/EnquiryForm'
import { getPayloadClient } from '../../../../lib/payload'
import { EMPLOYMENT_LABELS, isVacancyOpen } from '../../../../lib/vacancies'

export const revalidate = 600

interface Params {
  params: Promise<{ slug: string }>
}

async function findVacancy(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'vacancies',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
  })
  return result.docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const vacancies = await payload.find({
    collection: 'vacancies',
    where: { _status: { equals: 'published' } },
    limit: 100,
    depth: 0,
  })
  return vacancies.docs.filter((vacancy) => vacancy.slug).map((vacancy) => ({ slug: vacancy.slug! }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const vacancy = await findVacancy(slug)

  if (!vacancy) return { title: 'Vacancy not found' }

  return {
    title: `${vacancy.title} | Careers`,
    description: vacancy.summary,
    alternates: { canonical: `/careers/${vacancy.slug}` },
    // A closed post has nothing to offer a search result.
    robots: isVacancyOpen(vacancy) ? undefined : { index: false },
  }
}

export default async function VacancyPage({ params }: Params) {
  const { slug } = await params
  const vacancy = await findVacancy(slug)

  if (!vacancy) notFound()

  const open = isVacancyOpen(vacancy)

  return (
    <>
      <BreadcrumbJsonLd
        trail={[
          { name: 'Careers', href: '/careers' },
          { name: vacancy.title, href: `/careers/${vacancy.slug}` },
        ]}
      />

      <Section tone="plain">
        <Container className="max-w-3xl">
          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-maroon-700 hover:text-maroon-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All vacancies
          </Link>

          <h1 className="mt-6 text-3xl sm:text-4xl">{vacancy.title}</h1>
          <p className="mt-4 text-lg text-[var(--text-muted)]">{vacancy.summary}</p>

          {!open ? (
            <p
              role="status"
              className="mt-6 rounded-[var(--radius-card)] border border-maroon-200 bg-maroon-50 p-4 text-sm text-maroon-900"
              data-testid="vacancy-closed"
            >
              This post has closed and is no longer taking applications.{' '}
              <Link href="/careers" className="font-semibold underline">
                See the posts open now
              </Link>
              .
            </p>
          ) : null}

          <Card className="mt-8 p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-maroon-700">
                  <Briefcase className="h-4 w-4" aria-hidden />
                  Terms
                </dt>
                <dd className="mt-1 text-sm text-[var(--text-body)]">
                  {EMPLOYMENT_LABELS[vacancy.employment] ?? vacancy.employment}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-maroon-700">
                  <CalendarClock className="h-4 w-4" aria-hidden />
                  Closing date
                </dt>
                <dd className="mt-1 text-sm text-[var(--text-body)]">
                  {vacancy.closingDate ? (
                    <time dateTime={vacancy.closingDate}>{formatDate(vacancy.closingDate)}</time>
                  ) : (
                    'Open until filled'
                  )}
                </dd>
              </div>
            </dl>
          </Card>
        </Container>
      </Section>

      {vacancy.body ? (
        <Section tone="plain" className="pt-0">
          <Container className="max-w-3xl">
            <Prose>
              <RichText data={vacancy.body} />
            </Prose>
          </Container>
        </Section>
      ) : null}

      {open ? (
        <Section tone="sunken" id="apply">
          <Container className="max-w-3xl">
            <SectionHeading eyebrow="Apply" title="How to apply" align="left" />
            {vacancy.howToApply ? (
              <p className="mb-6 whitespace-pre-line text-[var(--text-body)]">{vacancy.howToApply}</p>
            ) : null}
            <p className="mb-6 text-sm text-[var(--text-muted)]">
              Send the office a message below to say you are interested. Please do not send certificates or
              identity documents through this form.
            </p>
            <EnquiryForm preset={{ form: 'careers', position: vacancy.title.slice(0, 80) }} />
          </Container>
        </Section>
      ) : null}
    </>
  )
}
