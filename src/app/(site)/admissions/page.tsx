/**
 * Admissions (FR-16, FR-24).
 *
 * The requirements, the intake note and the FAQs all come from the admissions global.
 * The FAQs are also emitted as structured data, which is what produces the expandable
 * questions under a school's result in Google.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarCheck, CheckCircle2, FileText, Phone } from 'lucide-react'
import { Container, Card, Section, SectionHeading, ButtonLink, Badge } from '../../../components/ui'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd, FaqJsonLd } from '../../../components/seo/JsonLd'
import { getAdmissionsSettings, getMediaBySlug, getSiteSettings } from '../../../lib/payload'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Admissions',
  description:
    'How to join Alliance High School Nansana: requirements, what to bring, fees and how to apply for the Senior One and Senior Five intake.',
  alternates: { canonical: '/admissions' },
}

const STEPS = [
  {
    icon: FileText,
    title: 'Collect what you need',
    body: 'Gather the result slip, birth certificate and photographs listed below before you start.',
  },
  {
    icon: CalendarCheck,
    title: 'Apply',
    body: 'Fill in the form online, or collect one from the admissions office on any weekday.',
  },
  {
    icon: Phone,
    title: 'We get back to you',
    body: 'The admissions office reviews the application and contacts you about a place.',
  },
]

export default async function AdmissionsPage() {
  const [admissions, settings, headerImage] = await Promise.all([
    getAdmissionsSettings(),
    getSiteSettings(),
    getMediaBySlug('a-member-of-staff-guiding-a-student-alliance-high-nansana'),
  ])

  const requirements = admissions?.requirements ?? []
  const faqs = (admissions?.faqs ?? []).filter((faq) => faq.question && faq.answer)
  const open = admissions?.applicationsOpen ?? false
  const phone = settings?.phones?.[0]?.number
  const email = settings?.emails?.find((entry) => entry.label === 'Admissions')?.address

  return (
    <>
      <PageHeader
        title="Admissions"
        lead={admissions?.intakeNote ?? 'Joining Alliance High School Nansana.'}
        image={headerImage}
      />
      <BreadcrumbJsonLd trail={[{ name: 'Admissions', href: '/admissions' }]} />
      {faqs.length ? (
        <FaqJsonLd items={faqs.map((faq) => ({ question: faq.question!, answer: faq.answer! }))} />
      ) : null}

      <Section tone="plain">
        <Container>
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <Badge tone={open ? 'maroon' : 'muted'}>
              {open ? 'Applications are open' : 'Applications are closed at the moment'}
            </Badge>
            {admissions?.intakeNote ? (
              <span className="text-sm text-[var(--text-muted)]">{admissions.intakeNote}</span>
            ) : null}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Card key={step.title} className="p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon-700 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <step.icon className="h-6 w-6 text-maroon-700" aria-hidden />
                </div>
                <h2 className="mt-4 font-display text-lg">{step.title}</h2>
                <p className="mt-2 text-[var(--text-body)]">{step.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="sunken" id="requirements">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-widest text-maroon-700 uppercase">
                What to bring
              </p>
              <h2 className="text-3xl">Requirements</h2>

              <ul className="mt-6 space-y-3">
                {requirements.map((entry) => (
                  <li key={entry.item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-maroon-700" aria-hidden />
                    <span className="text-[var(--text-body)]">{entry.item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/admissions/fees" variant="secondary">
                  See the fees
                </ButtonLink>
                <ButtonLink href="/contact" variant="secondary">
                  Arrange a visit
                </ButtonLink>
              </div>
            </div>

            <Card className="p-6">
              <h2 className="font-display text-xl">Talk to the admissions office</h2>
              <p className="mt-2 text-[var(--text-body)]">
                If anything here is unclear, ask. Someone in the office will walk you through it.
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                {phone ? (
                  <div>
                    <dt className="font-medium text-[var(--text-strong)]">Telephone</dt>
                    <dd>
                      <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-maroon-700 hover:underline">
                        {phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {email ? (
                  <div>
                    <dt className="font-medium text-[var(--text-strong)]">Email</dt>
                    <dd>
                      <a href={`mailto:${email}`} className="text-maroon-700 hover:underline">
                        {email}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {settings?.officeHours?.length ? (
                  <div>
                    <dt className="font-medium text-[var(--text-strong)]">Office hours</dt>
                    <dd className="text-[var(--text-muted)]">
                      {settings.officeHours.map((entry) => (
                        <span key={entry.days} className="block">
                          {entry.days}: {entry.hours}
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </Card>
          </div>
        </Container>
      </Section>

      {faqs.length ? (
        <Section tone="plain" id="faqs">
          <Container>
            <SectionHeading eyebrow="Questions" title="Frequently asked" />
            <div className="mx-auto max-w-3xl divide-y divide-cream-300 rounded-[var(--radius-card)] border border-cream-300 bg-[var(--surface-raised)]">
              {faqs.map((faq) => (
                <details key={faq.question} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-lg">
                    {faq.question}
                    <span
                      aria-hidden
                      className="shrink-0 text-maroon-700 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[var(--text-body)]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="brand" className="py-14">
        <Container className="text-center">
          <h2 className="text-3xl text-white">Ready to apply?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-cream-200">
            {open
              ? 'Apply online in about ten minutes, or call the admissions office or visit the school on any weekday and we will start your application there.'
              : 'Online applications are closed at the moment. Call the admissions office or visit the school on any weekday to ask about a place.'}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {open ? (
              <Link
                href="/admissions/apply"
                className="inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-7 text-sm font-semibold text-ink-950 hover:bg-gold-400"
              >
                Apply online
              </Link>
            ) : null}
            {phone ? (
              <Link
                href={`tel:${phone.replace(/\s/g, '')}`}
                className={
                  open
                    ? 'inline-flex min-h-12 items-center rounded-lg border border-white px-7 text-sm font-semibold text-white hover:bg-white hover:text-maroon-800'
                    : 'inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-7 text-sm font-semibold text-ink-950 hover:bg-gold-400'
                }
              >
                Call {phone}
              </Link>
            ) : null}
            <ButtonLink
              href="/contact"
              variant="secondary"
              className="min-h-12 border-white px-7 text-white hover:bg-white hover:text-maroon-800"
            >
              Contact the school
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
