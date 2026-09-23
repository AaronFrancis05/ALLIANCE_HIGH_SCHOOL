/**
 * Track an application (FR-18). The page itself is static; the lookup is a server action.
 */

import React from 'react'
import type { Metadata } from 'next'
import { Container, Section } from '../../../../components/ui'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../../components/seo/JsonLd'
import { TrackForm } from '../../../../components/admissions/TrackForm'

export const metadata: Metadata = {
  title: 'Track an application',
  description: 'Check the progress of an application to Alliance High School Nansana with its reference.',
  alternates: { canonical: '/admissions/track' },
}

export default function TrackPage() {
  return (
    <>
      <PageHeader
        title="Track an application"
        lead="Enter the reference you were given when you applied."
        trail={[{ name: 'Admissions', href: '/admissions' }]}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: 'Admissions', href: '/admissions' },
          { name: 'Track an application', href: '/admissions/track' },
        ]}
      />
      <Section tone="plain">
        <Container className="max-w-2xl">
          <TrackForm />
        </Container>
      </Section>
    </>
  )
}
