/**
 * About the school (FR-01, FR-24).
 *
 * Everything on it comes from the site settings global, so the office edits it at
 * /admin without a developer.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Compass, Target, HeartHandshake, Sparkles } from 'lucide-react'
import { Container, Card, Section, SectionHeading, ButtonLink, isContentPlaceholder } from '../../../components/ui'
import { MediaImage, PlaceholderNote } from '../../../components/ui/MediaImage'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getMediaBySlug, getSiteSettings } from '../../../lib/payload'
import { schoolFacts } from '../../../lib/school-facts'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const name = settings?.schoolName ?? 'Alliance High School Nansana'

  return {
    title: 'About the school',
    description: `${name} is a secondary school in Nansana, Wakiso District, Uganda. Our vision, mission, values and what we stand for.`,
    alternates: { canonical: '/about' },
  }
}

export default async function AboutPage() {
  const [settings, headerImage, campusImage] = await Promise.all([
    getSiteSettings(),
    getMediaBySlug('senior-students-outside-the-classroom-block-alliance-high-nansana'),
    getMediaBySlug('senior-students-walking-along-the-palm-avenue-alliance-high-nansana'),
  ])

  const founded = settings?.foundedYear
  const values = settings?.coreValues ?? []
  const { staff } = schoolFacts

  const glance = [
    ...(isContentPlaceholder(founded) || !founded ? [] : [{ label: 'Founded', value: founded, note: '' }]),
    { label: 'Registration', value: schoolFacts.registrationNumber, note: 'Ministry of Education and Sports' },
    { label: 'UNEB centre', value: schoolFacts.unebCentre, note: 'O-Level and A-Level' },
    {
      label: 'Selection code',
      value: schoolFacts.selectionCode,
      note: `For ${schoolFacts.selectionClasses}`,
    },
    { label: 'Campus', value: `${schoolFacts.campusAcres} acres`, note: 'Day and boarding' },
    {
      label: 'Staff',
      value: `${staff.resident + staff.visiting} teachers`,
      note: `${staff.resident} resident, ${staff.visiting} visiting, plus ${staff.support} support staff`,
    },
  ]

  return (
    <>
      <PageHeader
        title="About the school"
        lead={settings?.tagline}
        image={headerImage}
        trail={[]}
      />
      <BreadcrumbJsonLd trail={[{ name: 'About the school', href: '/about' }]} />

      <Section tone="plain">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-widest text-maroon-700 uppercase">Our story</p>
              <h2 className="text-3xl">A school built on discipline and attention</h2>

              <div className="mt-6 space-y-4 text-[var(--text-body)]">
                {isContentPlaceholder(founded) ? (
                  <p className="rounded-[var(--radius-card)] border border-dashed border-cream-300 bg-cream-100 p-4 text-sm text-[var(--text-muted)]">
                    The school&rsquo;s founding year has not been supplied yet. It will appear here once
                    the office adds it.
                  </p>
                ) : (
                  <p>
                    Alliance High School Nansana was established in {founded} to nurture boys and girls
                    into great thinkers and socially responsible citizens. Since then it has offered
                    comprehensive and vocational education to O-Level and A-Level students.
                  </p>
                )}
                <p>
                  It is a private, mixed day and boarding school in Nansana, Wakiso District, on a{' '}
                  {schoolFacts.campusAcres}-acre campus. Students aged {schoolFacts.ageRange} join us
                  from Senior One through to Senior Six, and each class from Senior One to Senior Four
                  has {schoolFacts.oLevelStreams} streams. The school is interdenominational and welcomes
                  students of every religious background.
                </p>
                <p>
                  Teaching is in the hands of {schoolFacts.staff.resident} resident teachers and{' '}
                  {schoolFacts.staff.visiting} visiting teachers, supported by{' '}
                  {schoolFacts.staff.support} support staff. What we ask of every learner is the same:
                  come to work, be known by name, and leave better than you arrived. Our motto,{' '}
                  <em>{settings?.motto ?? 'Adfecto Excellentia'}</em>
                  {settings?.mottoMeaning ? ` (${settings.mottoMeaning.toLowerCase()})` : null}, is
                  meant literally.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/academics">What we teach</ButtonLink>
                <ButtonLink href="/admissions" variant="secondary">
                  How to join
                </ButtonLink>
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
              <MediaImage media={campusImage} sizes="(max-width: 1024px) 100vw, 40vw" />
              <PlaceholderNote media={campusImage} />
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl">The school at a glance</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {glance.map((item) => (
                <Card key={item.label} className="p-5">
                  <dt className="text-xs font-semibold tracking-widest text-maroon-700 uppercase">{item.label}</dt>
                  <dd className="mt-2 font-display text-xl text-[var(--text-strong)]">{item.value}</dd>
                  {item.note ? <dd className="mt-1 text-sm text-[var(--text-muted)]">{item.note}</dd> : null}
                </Card>
              ))}
            </dl>
          </div>
        </Container>
      </Section>

      <Section tone="sunken">
        <Container>
          <SectionHeading
            eyebrow="What we stand for"
            title="Vision, mission and values"
            lead="The commitments the school measures itself against."
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <Compass className="h-7 w-7 text-maroon-700" aria-hidden />
              <h3 className="mt-3 font-display text-xl">Our vision</h3>
              <p className="mt-2 text-[var(--text-body)]">{settings?.vision}</p>
            </Card>

            <Card className="p-6">
              <Target className="h-7 w-7 text-maroon-700" aria-hidden />
              <h3 className="mt-3 font-display text-xl">Our mission</h3>
              <p className="mt-2 text-[var(--text-body)]">{settings?.mission}</p>
            </Card>

            <Card className="p-6">
              <HeartHandshake className="h-7 w-7 text-maroon-700" aria-hidden />
              <h3 className="mt-3 font-display text-xl">Core values</h3>
              {values.length ? (
                <ul className="mt-3 space-y-2">
                  {values.map((entry) => (
                    <li key={entry.value} className="flex gap-2 text-[var(--text-body)]">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                      <span>
                        <span className="font-medium text-[var(--text-strong)]">{entry.value}</span>
                        {entry.description ? `: ${entry.description}` : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[var(--text-muted)]">Values will be listed here.</p>
              )}
            </Card>

            <Card className="p-6">
              <Sparkles className="h-7 w-7 text-maroon-700" aria-hidden />
              <h3 className="mt-3 font-display text-xl">
                Theme for {settings?.themeOfTheYear?.year ?? new Date().getFullYear()}
              </h3>
              <p className="mt-2 text-[var(--text-body)]">{settings?.themeOfTheYear?.theme}</p>
              {settings?.themeOfTheYear?.reference ? (
                <p className="mt-1 text-sm text-[var(--text-muted)]">{settings.themeOfTheYear.reference}</p>
              ) : null}
            </Card>
          </div>
        </Container>
      </Section>

      <Section tone="plain">
        <Container>
          <SectionHeading
            eyebrow="Leadership and staff"
            title="The people who run the school"
            lead="Names, photographs and responsibilities."
          />
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            <Link href="/about/leadership" className="group block">
              <Card className="h-full p-6 transition-colors group-hover:border-maroon-600">
                <h3 className="font-display text-xl text-maroon-700">Leadership</h3>
                <p className="mt-2 text-[var(--text-body)]">The school administration and the Board of Governors.</p>
              </Card>
            </Link>
            <Link href="/about/staff" className="group block">
              <Card className="h-full p-6 transition-colors group-hover:border-maroon-600">
                <h3 className="font-display text-xl text-maroon-700">Our staff</h3>
                <p className="mt-2 text-[var(--text-body)]">Heads of department, teachers and support staff.</p>
              </Card>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
