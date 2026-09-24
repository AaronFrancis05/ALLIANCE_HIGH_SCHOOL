/**
 * School leadership: the administration and the Board of Governors, from the Staff
 * directory. Saving a staff profile revalidates this page.
 */

import React from 'react'
import type { Metadata } from 'next'
import { Container, Section } from '../../../../components/ui'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../../components/seo/JsonLd'
import { StaffDirectory } from '../../../../components/content/StaffDirectory'
import { getStaffProfiles } from '../../../../lib/payload'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Leadership',
  description: 'The administration and Board of Governors of Alliance High School Nansana.',
  alternates: { canonical: '/about/leadership' },
}

export default async function LeadershipPage() {
  const people = await getStaffProfiles()
  return (
    <>
      <PageHeader
        title="Leadership"
        lead="The people responsible for running the school."
        trail={[{ name: 'About', href: '/about' }]}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: 'About', href: '/about' },
          { name: 'Leadership', href: '/about/leadership' },
        ]}
      />
      <Section tone="plain">
        <Container>
          <StaffDirectory
            people={people}
            groups={[
              { group: 'director', featureFirst: true },
              { group: 'administration', featureFirst: true },
              { group: 'board' },
            ]}
            emptyBody="The school administration and Board of Governors will be listed here once the school supplies names, titles and photographs."
          />
        </Container>
      </Section>
    </>
  )
}
