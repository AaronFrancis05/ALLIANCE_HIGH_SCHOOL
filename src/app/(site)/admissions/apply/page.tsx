/**
 * Apply online (FR-16).
 *
 * The page is static; the admissions global decides whether the form is offered, and
 * saving that global revalidates this page. The submit action checks the switch again,
 * so a stale page can never slip an application through after applications close.
 */

import React from 'react'
import type { Metadata } from 'next'
import { Container, Section, ButtonLink, Card } from '../../../../components/ui'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../../components/seo/JsonLd'
import { ApplicationForm } from '../../../../components/admissions/ApplicationForm'
import { getAdmissionsSettings } from '../../../../lib/payload'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Apply online',
  description:
    'Apply to Alliance High School Nansana online for Senior One, Senior Five or a transfer into another class.',
  alternates: { canonical: '/admissions/apply' },
}

function Closed() {
  return (
    <Card className="p-6 sm:p-8">
      <h2 className="font-display text-2xl">Applications are closed at the moment</h2>
      <p className="mt-3 text-[var(--text-body)]">
        The online form opens again for the next intake. In the meantime, the admissions office
        can tell you what is possible.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/contact">Contact the school</ButtonLink>
        <ButtonLink href="/admissions" variant="secondary">
          Back to admissions
        </ButtonLink>
      </div>
    </Card>
  )
}

export default async function ApplyPage() {
  const admissions = await getAdmissionsSettings()
  const open = admissions?.applicationsOpen ?? false

  return (
    <>
      <PageHeader
        title="Apply online"
        lead={admissions?.intakeNote ?? 'Joining Alliance High School Nansana.'}
        trail={[{ name: 'Admissions', href: '/admissions' }]}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: 'Admissions', href: '/admissions' },
          { name: 'Apply online', href: '/admissions/apply' },
        ]}
      />

      <Section tone="plain">
        <Container className="max-w-3xl">
          {open ? (
            <>
              <p className="mb-8 text-[var(--text-body)]">
                The form takes about ten minutes. Have the student&rsquo;s results to hand. There is
                nothing to pay online.
              </p>
              <ApplicationForm />
            </>
          ) : (
            <Closed />
          )}
        </Container>
      </Section>
    </>
  )
}
