/**
 * Staff: heads of department, teachers and support staff, from the Staff directory.
 * Saving a staff profile revalidates this page.
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
  title: 'Our staff',
  description: 'Heads of department, teachers and support staff at Alliance High School Nansana.',
  alternates: { canonical: '/about/staff' },
}

export default async function StaffPage() {
  const people = await getStaffProfiles()
  return (
    <>
      <PageHeader
        title="Our staff"
        lead="Heads of department, teachers and the staff who support them."
        trail={[{ name: 'About', href: '/about' }]}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: 'About', href: '/about' },
          { name: 'Our staff', href: '/about/staff' },
        ]}
      />
      <Section tone="plain">
        <Container>
          <StaffDirectory
            people={people}
            groups={[{ group: 'hods', splitByLevel: true }, { group: 'teaching' }, { group: 'support' }]}
            emptyBody="Heads of department, teaching and support staff will be listed here once the school supplies names, subjects and photographs."
          />
        </Container>
      </Section>
    </>
  )
}
