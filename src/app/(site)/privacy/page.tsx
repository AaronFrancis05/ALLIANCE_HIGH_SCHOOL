/**
 * Privacy notice.
 *
 * The site holds personal data about children, so this page states plainly what is held,
 * why, who can see it and how long it is kept. It mirrors the data rules in docs/SRS.md
 * section 6 — if one changes, change both.
 */

import React from 'react'
import type { Metadata } from 'next'
import { Container, Section, Prose } from '../../../components/ui'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getSiteSettings } from '../../../lib/payload'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Privacy notice',
  description:
    'What personal information Alliance High School Nansana holds through this website, why it is held, who can see it and how long it is kept.',
  alternates: { canonical: '/privacy' },
}

export default async function PrivacyPage() {
  const settings = await getSiteSettings()
  const email = settings?.emails?.[0]?.address
  const phone = settings?.phones?.[0]?.number

  return (
    <>
      <PageHeader
        title="Privacy notice"
        lead="What we hold about you and your child, and what we do with it."
      />
      <BreadcrumbJsonLd trail={[{ name: 'Privacy notice', href: '/privacy' }]} />

      <Section tone="plain">
        <Container className="max-w-3xl">
          <Prose>
            <h2>Who this notice is from</h2>
            <p>
              This notice covers the website of {settings?.schoolName ?? 'Alliance High School Nansana'},
              Nansana, Wakiso District, Uganda. It explains what the school does with personal
              information collected through this site.
            </p>

            <h2>What we collect</h2>
            <p>When a family applies to the school through this website, we collect:</p>
            <ul>
              <li>the applicant&rsquo;s name, date of birth, sex and previous school;</li>
              <li>a parent or guardian&rsquo;s name, telephone number and email address;</li>
              <li>documents you attach, such as a result slip or birth certificate.</li>
            </ul>
            <p>For a student who signs in to the portal, we hold:</p>
            <ul>
              <li>admission number, name, class and residence;</li>
              <li>guardian name and telephone number;</li>
              <li>fee clearance status for each term, and termly results.</li>
            </ul>
            <p>
              We do <strong>not</strong> collect home addresses, medical information or national
              identification numbers through this website.
            </p>

            <h2>Why we hold it</h2>
            <p>
              To consider an application, to admit and teach a student, to publish that
              student&rsquo;s results to them and their parents, and to contact a family about
              school matters. We do not sell personal information, and we do not share it with
              anyone outside the school except where the law requires it.
            </p>

            <h2>Who can see it</h2>
            <p>
              Access is limited by role. The admissions officer sees applications. The registrar
              handles results. The bursar records fee clearance and cannot read report cards. A
              student sees their own records and no one else&rsquo;s. Every time a report card is
              opened or refused, the system records who asked and what happened.
            </p>

            <h2>How it is protected</h2>
            <p>
              Result files and application documents are kept in private storage that is not
              readable from the internet. They are released only through a link that is checked
              against your sign-in each time and expires within minutes. Connections to this site
              are encrypted.
            </p>

            <h2>How long we keep it</h2>
            <p>
              Unsuccessful applications and their documents are deleted after the intake they
              relate to. Student records are kept for as long as the student is at the school and
              for the period afterwards that Ugandan school record-keeping requires.
            </p>

            <h2>Cookies</h2>
            <p>
              This site sets a cookie only to keep you signed in to the student portal or the
              admin panel. There is no advertising or third-party tracking on this website.
            </p>

            <h2>Your choices</h2>
            <p>
              You may ask to see what we hold about you or your child, ask us to correct anything
              that is wrong, or ask a question about this notice. Contact the school office
              {email ? (
                <>
                  {' '}
                  by email at <a href={`mailto:${email}`}>{email}</a>
                </>
              ) : null}
              {phone ? (
                <>
                  {' '}
                  or by telephone on <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
                </>
              ) : null}
              .
            </p>

            <h2>Photographs</h2>
            <p>
              Photographs of students appear on this site and on school notice boards. A
              recognisable photograph of a student is published only with a parent&rsquo;s
              consent. If you would like a photograph of your child removed, tell the school
              office and we will take it down.
            </p>
          </Prose>
        </Container>
      </Section>
    </>
  )
}
