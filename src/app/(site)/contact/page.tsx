/**
 * Contact (FR-21, FR-24).
 *
 * Every detail comes from the site settings global. The enquiry form (P2-T9) sends a
 * message to the office and saves it under Enquiries in the admin panel. The map always
 * shows: see src/lib/map.ts for how it finds the school.
 */

import React from 'react'
import type { Metadata } from 'next'
import { Mail, MapPin, Navigation, Phone, Clock } from 'lucide-react'
import { ButtonLink, Container, Card, Section, SectionHeading } from '../../../components/ui'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { EnquiryForm } from '../../../components/contact/EnquiryForm'
import { getMediaBySlug, getSiteSettings } from '../../../lib/payload'
import { mapDirectionsUrl, mapEmbedUrl } from '../../../lib/map'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Telephone, email, postal address and office hours for Alliance High School Nansana in Nansana, Wakiso District, Uganda.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const [settings, headerImage] = await Promise.all([
    getSiteSettings(),
    getMediaBySlug('placeholder-main-gate-alliance-high-nansana'),
  ])

  const phones = settings?.phones ?? []
  const emails = settings?.emails ?? []
  const address = settings?.address
  const hours = settings?.officeHours ?? []

  const enteredLines = [address?.line1, address?.district, address?.country].filter(Boolean)
  // The town and district are already public (page description, structured data); they
  // stand in until the office fills in the address under School details.
  const addressLines = enteredLines.length ? enteredLines : ['Nansana', 'Wakiso District', 'Uganda']

  const schoolName = settings?.schoolName ?? 'Alliance High School Nansana'
  const location = {
    schoolName,
    mapEmbedUrl: address?.mapEmbedUrl,
    latitude: address?.latitude,
    longitude: address?.longitude,
  }

  return (
    <>
      <PageHeader
        title="Contact"
        lead="How to reach the school, and when someone will be there."
        image={headerImage}
      />
      <BreadcrumbJsonLd trail={[{ name: 'Contact', href: '/contact' }]} />

      <Section tone="plain">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {phones.length ? (
              <Card className="p-6">
                <Phone className="h-7 w-7 text-maroon-700" aria-hidden />
                <h2 className="mt-3 font-display text-lg">Telephone</h2>
                <ul className="mt-3 space-y-2">
                  {phones.map((entry) => (
                    <li key={entry.number}>
                      <a
                        href={`tel:${entry.number.replace(/\s/g, '')}`}
                        className="font-medium text-maroon-700 hover:underline"
                      >
                        {entry.number}
                      </a>
                      <span className="block text-sm text-[var(--text-muted)]">
                        {entry.label}
                        {entry.whatsapp ? ' · WhatsApp' : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {emails.length ? (
              <Card className="p-6">
                <Mail className="h-7 w-7 text-maroon-700" aria-hidden />
                <h2 className="mt-3 font-display text-lg">Email</h2>
                <ul className="mt-3 space-y-2">
                  {emails.map((entry) => (
                    <li key={entry.address}>
                      <a
                        href={`mailto:${entry.address}`}
                        className="font-medium break-all text-maroon-700 hover:underline"
                      >
                        {entry.address}
                      </a>
                      <span className="block text-sm text-[var(--text-muted)]">{entry.label}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <Card className="p-6">
              <MapPin className="h-7 w-7 text-maroon-700" aria-hidden />
              <h2 className="mt-3 font-display text-lg">Where we are</h2>
              <address className="mt-3 text-[var(--text-body)] not-italic">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                {address?.poBox ? <span className="mt-2 block">{address.poBox}</span> : null}
              </address>
              <a
                href="#map"
                className="mt-3 inline-flex min-h-11 items-center font-medium text-maroon-700 hover:underline"
              >
                See it on the map
              </a>
            </Card>

            {hours.length ? (
              <Card className="p-6">
                <Clock className="h-7 w-7 text-maroon-700" aria-hidden />
                <h2 className="mt-3 font-display text-lg">Office hours</h2>
                <dl className="mt-3 space-y-1 text-sm">
                  {hours.map((entry) => (
                    <div key={entry.days} className="flex justify-between gap-4">
                      <dt className="text-[var(--text-body)]">{entry.days}</dt>
                      <dd className="text-[var(--text-muted)]">{entry.hours}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ) : null}

          </div>
        </Container>
      </Section>

      <Section tone="sunken" id="map">
        <Container>
          <SectionHeading eyebrow="Getting here" title="Find the school" />
          <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-cream-300 sm:aspect-[16/9]">
            <iframe
              src={mapEmbedUrl(location)}
              title={`Google map showing where ${schoolName} is`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>
          <div className="mt-6 text-center">
            <ButtonLink href={mapDirectionsUrl(location)} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-5 w-5" aria-hidden />
              Get directions
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section tone="plain" id="enquiry">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Write to us"
            title="Send the school a message"
            lead="For a question, a visit, registering as a former student, or asking about working here."
          />
          <EnquiryForm />
        </Container>
      </Section>

    </>
  )
}
