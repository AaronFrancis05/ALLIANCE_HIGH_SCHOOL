/**
 * Portal home (FR-10, FR-14).
 *
 * Shows the student their own details and their fee clearance, which is the thing that
 * most often explains why a report card is not available.
 */

import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, CheckCircle2, FileText, XCircle } from 'lucide-react'
import { Container, Card, Badge } from '../../../components/ui'
import { getPayloadClient } from '../../../lib/payload'
import { currentStudent } from '../../../lib/session'
import { CLASS_LABELS, type SchoolClass } from '../../../access/resources'
import type { AcademicTerm } from '../../../payload-types'

export default async function PortalHomePage() {
  const student = await currentStudent()
  if (!student) redirect('/portal/sign-in')

  const payload = await getPayloadClient()

  // `overrideAccess: false` makes Payload apply readClearances, so this cannot return
  // another student's row even if the query were wrong.
  const clearances = await payload.find({
    collection: 'feeClearances',
    where: { student: { equals: student.id } },
    depth: 2,
    limit: 10,
    overrideAccess: false,
    user: student,
  })

  const cleared = clearances.docs.filter((row) => row.status === 'cleared').length
  const blocked = clearances.docs.filter((row) => row.status === 'blocked')

  return (
    <Container className="max-w-4xl">
      <h1 className="text-3xl">
        Hello, {student.firstName ?? student.admissionNo}
      </h1>
      <p className="mt-2 text-[var(--text-muted)]">
        {student.class ? CLASS_LABELS[student.class as SchoolClass] : null}
        {student.stream ? ` · ${student.stream}` : null} · {student.admissionNo}
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card className="p-6">
          <FileText className="h-7 w-7 text-maroon-700" aria-hidden />
          <h2 className="mt-3 font-display text-lg">Report cards</h2>
          <p className="mt-2 text-sm text-[var(--text-body)]">
            Your results for each term, once they have been released and your fees are cleared.
          </p>
          <Link
            href="/portal/results"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-maroon-700 hover:text-maroon-900"
          >
            Open my results →
          </Link>
        </Card>

        <Card className="p-6">
          <BookOpen className="h-7 w-7 text-maroon-700" aria-hidden />
          <h2 className="mt-3 font-display text-lg">e-Library</h2>
          <p className="mt-2 text-sm text-[var(--text-body)]">
            Notes, past papers and textbooks for your class.
          </p>
          <Link
            href="/resources"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-maroon-700 hover:text-maroon-900"
          >
            Browse the library →
          </Link>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl">Fee clearance</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Recorded by the bursar, one decision per term.
        </p>

        {clearances.docs.length ? (
          <ul className="mt-5 space-y-3">
            {clearances.docs.map((row) => {
              const term = row.term as AcademicTerm | undefined
              const isCleared = row.status === 'cleared'

              return (
                <Card as="li" key={row.id} className="flex flex-wrap items-center gap-4 p-5">
                  {isCleared ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-green-700" aria-hidden />
                  ) : (
                    <XCircle className="h-6 w-6 shrink-0 text-maroon-700" aria-hidden />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--text-strong)]">
                      {typeof term === 'object' && term
                        ? `Term ${term.term}, ${term.year}`
                        : 'Term'}
                    </p>
                    {!isCleared && row.reason ? (
                      <p className="mt-0.5 text-sm text-[var(--text-muted)]">{row.reason}</p>
                    ) : null}
                  </div>

                  <Badge tone={isCleared ? 'muted' : 'maroon'}>
                    {isCleared ? 'Cleared' : 'On hold'}
                  </Badge>
                </Card>
              )
            })}
          </ul>
        ) : (
          <Card className="mt-5 p-6">
            <p className="text-[var(--text-body)]">
              No clearance has been recorded for you yet. The bursar records one for each term.
            </p>
          </Card>
        )}

        {blocked.length ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            {cleared > 0 ? 'Some terms are on hold. ' : ''}
            Please speak to the bursar&rsquo;s office to clear a term.
          </p>
        ) : null}
      </section>
    </Container>
  )
}
