/**
 * The student's report cards (FR-13, FR-14, FR-15).
 *
 * This page decides nothing on its own. For each card it calls the same
 * `evaluateReportCardAccess` the download route calls, so what a student is told here and
 * what the server will actually allow can never drift apart. The download link is rendered
 * only when the gate says yes, and the route checks again anyway.
 */

import React from 'react'
import { redirect } from 'next/navigation'
import { Download, Lock } from 'lucide-react'
import { Container, Card, EmptyState } from '../../../../components/ui'
import { getPayloadClient } from '../../../../lib/payload'
import { currentStudent } from '../../../../lib/session'
import { evaluateReportCardAccess } from '../../../../access/report-cards'
import type { AcademicTerm, FeeClearance } from '../../../../payload-types'

export const metadata = { title: 'My results' }

export default async function ResultsPage() {
  const student = await currentStudent()
  if (!student) redirect('/portal/sign-in')

  const payload = await getPayloadClient()

  // Both queries run as the student, so the access rules do the filtering.
  const [cards, clearances] = await Promise.all([
    payload.find({
      collection: 'reportCards',
      where: { student: { equals: student.id } },
      depth: 2,
      limit: 30,
      overrideAccess: false,
      user: student,
    }),
    payload.find({
      collection: 'feeClearances',
      where: { student: { equals: student.id } },
      depth: 1,
      limit: 30,
      overrideAccess: false,
      user: student,
    }),
  ])

  /** Clearance for a term id, if the bursar has recorded one. */
  function clearanceForTerm(termId: string | number | null) {
    if (termId === null) return null
    const row = clearances.docs.find((entry) => {
      const term = entry.term as FeeClearance['term']
      const id = typeof term === 'object' && term ? term.id : term
      return String(id) === String(termId)
    })
    if (!row) return null
    return { status: row.status as 'cleared' | 'blocked', reason: row.reason }
  }

  return (
    <Container className="max-w-3xl">
      <h1 className="text-3xl">My results</h1>
      <p className="mt-2 text-[var(--text-muted)]">
        A report card appears here once the school has released that term&rsquo;s results and your
        fees for the term are cleared.
      </p>

      {cards.docs.length ? (
        <ul className="mt-8 space-y-4">
          {cards.docs.map((card) => {
            const term = card.term as AcademicTerm | number | undefined
            const termDoc = typeof term === 'object' && term !== null ? term : undefined
            // The relationship arrives either populated or as a bare id, depending on depth.
            const termId: string | number | null = termDoc ? termDoc.id : typeof term === 'number' ? term : null

            const decision = evaluateReportCardAccess({
              requester: { id: student.id, collection: 'students' },
              ownerId: student.id,
              termReleased: Boolean(termDoc?.resultsReleased),
              clearance: clearanceForTerm(termId),
              published: Boolean(card.published),
            })

            return (
              <Card as="li" key={card.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg">
                      {termDoc ? `Term ${termDoc.term}, ${termDoc.year}` : card.label}
                    </h2>
                    {termDoc?.endDate ? (
                      <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                        Term ended{' '}
                        {new Date(termDoc.endDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    ) : null}
                  </div>

                  {decision.allowed ? (
                    <a
                      href={`/api/files/report-card/${card.id}`}
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-maroon-700 px-5 text-sm font-semibold text-white hover:bg-maroon-800"
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      Download
                    </a>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cream-200 px-4 py-2.5 text-sm font-medium text-[var(--text-muted)]">
                      <Lock className="h-4 w-4" aria-hidden />
                      Not available
                    </span>
                  )}
                </div>

                {!decision.allowed ? (
                  <p className="mt-3 rounded-[var(--radius-card)] bg-cream-100 p-3 text-sm text-[var(--text-body)]">
                    {decision.message}
                  </p>
                ) : null}
              </Card>
            )
          })}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No report cards yet"
            body="When the school releases a term's results, your report card will appear here."
          />
        </div>
      )}
    </Container>
  )
}
