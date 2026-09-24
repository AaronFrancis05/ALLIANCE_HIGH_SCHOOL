/**
 * Fees structure (FR-24).
 *
 * The amounts come from the admissions global. Until the bursar supplies them they show
 * as bracketed placeholders rather than invented figures (AGENTS.md rule 6).
 */

import React from 'react'
import type { Metadata } from 'next'
import { Info } from 'lucide-react'
import { Container, Card, Section, ButtonLink, isContentPlaceholder } from '../../../../components/ui'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../../components/seo/JsonLd'
import { getAdmissionsSettings, getMediaBySlug } from '../../../../lib/payload'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Fees structure',
  description:
    'School fees for each class at Alliance High School Nansana, for boarding and day students, and how fees are paid.',
  alternates: { canonical: '/admissions/fees' },
}

/** Placeholder amounts are shown in a muted style so nobody mistakes one for a figure. */
function Amount({ value }: { value?: string | null }) {
  if (!value) return <span className="text-[var(--text-muted)]">—</span>
  if (isContentPlaceholder(value)) {
    return <span className="text-sm text-[var(--text-muted)] italic">to be confirmed</span>
  }
  return <span className="font-medium text-[var(--text-strong)]">{value}</span>
}

export default async function FeesPage() {
  const [admissions, headerImage] = await Promise.all([
    getAdmissionsSettings(),
    getMediaBySlug('students-studying-together-in-the-school-garden-alliance-high-nansana'),
  ])

  const fees = admissions?.fees ?? []
  const allPending = fees.every(
    (row) => isContentPlaceholder(row.tuition) && isContentPlaceholder(row.total),
  )

  return (
    <>
      <PageHeader
        title="Fees structure"
        lead="What each class pays per term, and how to pay."
        image={headerImage}
        trail={[{ name: 'Admissions', href: '/admissions' }]}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: 'Admissions', href: '/admissions' },
          { name: 'Fees structure', href: '/admissions/fees' },
        ]}
      />

      <Section tone="plain">
        <Container>
          {allPending ? (
            <div className="mb-8 flex gap-3 rounded-[var(--radius-card)] border border-gold-300 bg-gold-50 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" aria-hidden />
              <p className="text-sm text-ink-800">
                The fees for the coming term have not been published yet. Please call the bursar&rsquo;s
                office for the current figures — we would rather show nothing than a figure that is out
                of date.
              </p>
            </div>
          ) : null}

          {/* The table scrolls sideways inside its own box rather than pushing the page wide. */}
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-cream-300">
            <table className="w-full min-w-[34rem] border-collapse bg-[var(--surface-raised)] text-left">
              <caption className="sr-only">School fees per term by class and residence</caption>
              <thead>
                <tr className="bg-cream-100">
                  <th scope="col" className="px-4 py-3 text-sm font-semibold">
                    Class
                  </th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold">
                    Tuition
                  </th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold">
                    Other charges
                  </th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold">
                    Total per term
                  </th>
                </tr>
              </thead>
              <tbody>
                {fees.map((row) => (
                  <tr key={row.category} className="border-t border-cream-300">
                    <th scope="row" className="px-4 py-3 text-sm font-medium text-[var(--text-strong)]">
                      {row.category}
                    </th>
                    <td className="px-4 py-3 text-sm">
                      <Amount value={row.tuition} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Amount value={row.other} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Amount value={row.total} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {admissions?.feesNote ? (
            <Card className="mt-8 p-6">
              <h2 className="font-display text-lg">How fees are paid</h2>
              <p className="mt-2 text-[var(--text-body)]">{admissions.feesNote}</p>
            </Card>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/admissions">Back to admissions</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Ask the bursar
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
