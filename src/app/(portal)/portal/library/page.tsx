/**
 * The student's e-Library (FR-06, FR-08, FR-09).
 *
 * The query runs as the student with `overrideAccess: false`, so `readResources` decides
 * what is listed: public items, students-only items and their own class's items, and
 * nothing for a suspended student beyond the public shelf. Each download goes through
 * `/api/files/resource/<id>`, which checks again before issuing a signed URL.
 */

import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Container, EmptyState } from '../../../../components/ui'
import { ResourceCard } from '../../../../components/content/ResourceCard'
import { getPayloadClient } from '../../../../lib/payload'
import { currentStudent } from '../../../../lib/session'
import { CLASS_LABELS, type SchoolClass } from '../../../../access/resources'

export const metadata = { title: 'e-Library' }

export default async function PortalLibraryPage() {
  const student = await currentStudent()
  if (!student) redirect('/portal/sign-in')

  const payload = await getPayloadClient()

  const resources = await payload.find({
    collection: 'resources',
    sort: '-createdAt',
    limit: 100,
    depth: 1,
    // The access rule decides what is visible. Never pass true here.
    overrideAccess: false,
    user: student,
  })

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

      {resources.docs.length ? (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.docs.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Nothing for your class yet"
            body="Your teachers add notes and past papers here. Check back after your next lesson."
          />
        </div>
      )}
    </Container>
  )
}
