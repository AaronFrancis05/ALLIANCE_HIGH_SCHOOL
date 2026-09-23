/**
 * The student's e-Library (FR-06, FR-08, FR-09).
 *
 * `loadLibraryShelf` reads as the student with `overrideAccess: false`, so `readResources`
 * decides what is listed: public items, students-only items and their own class's items,
 * and nothing for a suspended student beyond the public shelf. The filters only narrow
 * that. Each download goes through `/api/files/resource/<id>`, which checks again before
 * issuing a signed URL.
 */

import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Container, EmptyState } from '../../../../components/ui'
import { ResourceCard } from '../../../../components/content/ResourceCard'
import { ResourceFilters } from '../../../../components/content/ResourceFilters'
import { getPayloadClient } from '../../../../lib/payload'
import { currentStudent } from '../../../../lib/session'
import { loadLibraryShelf } from '../../../../lib/library'
import { hasFilters, parseResourceFilters } from '../../../../lib/resource-filters'
import { CLASS_LABELS, type SchoolClass } from '../../../../access/resources'

export const metadata = { title: 'e-Library' }

export default async function PortalLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const student = await currentStudent()
  if (!student) redirect('/portal/sign-in')

  const payload = await getPayloadClient()
  const filters = parseResourceFilters(await searchParams)
  const shelf = await loadLibraryShelf(payload, filters, student)

  const className = student.class ? CLASS_LABELS[student.class as SchoolClass] : null

  return (
    <Container>
      <p className="text-sm">
        <Link href="/portal" className="text-maroon-700 hover:text-maroon-900">
          ← Portal home
        </Link>
      </p>
      <h1 className="mt-2 text-3xl">e-Library</h1>
      <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
        Notes, past papers and textbooks for {className ?? 'your class'}, and material shared with
        the whole school. Each file shows its size, so you know what a download will cost in data.
      </p>

      <div className="mt-8">
        <ResourceFilters
          action="/portal/library"
          filters={filters}
          subjects={shelf.subjects}
          years={shelf.years}
          total={shelf.total}
        />
      </div>

      {shelf.resources.length ? (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shelf.resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </ul>
      ) : (
        <div className="mt-8">
          {hasFilters(filters) ? (
            <EmptyState
              title="Nothing matches these filters"
              body="Try fewer filters, or clear them to see everything for your class."
            />
          ) : (
            <EmptyState
              title="Nothing for your class yet"
              body="Your teachers add notes and past papers here. Check back after your next lesson."
            />
          )}
        </div>
      )}
    </Container>
  )
}
