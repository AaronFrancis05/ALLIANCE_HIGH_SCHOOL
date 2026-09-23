/**
 * Contact (FR-21, FR-24).
 *
 * Every detail comes from the site settings global. The enquiry form itself is P2-T9;
 * until then this page gives every way of reaching the school that already exists.
 */

import React from 'react'
import type { Metadata } from 'next'
import { Mail, MapPin, Phone, Clock, MessageCircle } from 'lucide-react'
import { Container, Card, Section, SectionHeading } from '../../../components/ui'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getMediaBySlug, getSiteSettings } from '../../../lib/payload'

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

  const addressLines = [address?.line1, address?.district, address?.country].filter(Boolean)

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

            <Card className="p-6 md:col-span-2 lg:col-span-1">
              <MessageCircle className="h-7 w-7 text-maroon-700" aria-hidden />
              <h2 className="mt-3 font-display text-lg">Send us a message</h2>
              <p className="mt-2 text-[var(--text-body)]">
                The online enquiry form is being finished. For now, please call the school office or
                send an email — both reach the same people, and you will get an answer the same day
                during office hours.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      {address?.mapEmbedUrl ? (
        <Section tone="sunken">
          <Container>
            <SectionHeading eyebrow="Getting here" title="Find the school" />
            <div className="aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] border border-cream-300">
              <iframe
                src={address.mapEmbedUrl}
                title="Map showing Alliance High School Nansana"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  )
}
