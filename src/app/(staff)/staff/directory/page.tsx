/**
 * The staff directory (FR-05): colleagues' names, roles and departments, for signed-in staff
 * only. Read as the staff member, so the Users collection's own rule decides who sees it.
 * Email addresses are not shown.
 */

import React from 'react'
import type { Metadata } from 'next'
import { Container, Card, EmptyState } from '../../../../components/ui'
import { getPayloadClient } from '../../../../lib/payload'
import { requirePortalStaff } from '../../../../lib/session'
import { ACCOUNT_TYPE_LABELS, ROLE_LABELS, rolesOf } from '../../../../access/roles'
import type { Department } from '../../../../payload-types'

export const metadata: Metadata = { title: 'Staff directory' }

export default async function StaffDirectoryPage() {
  const staff = await requirePortalStaff()
  const payload = await getPayloadClient()

  const people = await payload.find({
    collection: 'users',
    where: { active: { not_equals: false } },
    sort: 'name',
    limit: 500,
    depth: 1,
    select: { name: true, accountType: true, roles: true, department: true, active: true },
    overrideAccess: false,
    user: { ...staff, collection: 'users' },
  })

  return (
    <Container className="max-w-4xl">
      <h1 className="text-3xl">Staff directory</h1>
      <p className="mt-2 text-[var(--text-muted)]">{people.totalDocs} colleagues with an account.</p>

      {people.docs.length ? (
        <Card className="mt-8 divide-y divide-cream-200">
          {people.docs.map((person) => {
            const roles = rolesOf({ ...person, collection: 'users' }).map((role) => ROLE_LABELS[role])
            const access =
              person.accountType === 'superAdmin' ? ACCOUNT_TYPE_LABELS.superAdmin : roles.join(', ') || 'Staff'
            const department = typeof person.department === 'object' ? (person.department as Department | null) : null

            return (
              <div key={person.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-[var(--text-strong)]">{person.name}</span>
                <span className="text-sm text-[var(--text-muted)]">
                  {access}
                  {department?.name ? ` · ${department.name}` : ''}
                </span>
              </div>
            )
          })}
        </Card>
      ) : (
        <div className="mt-8">
          <EmptyState title="No colleagues yet" body="Staff accounts appear here once the ICT office adds them." />
        </div>
      )}
    </Container>
  )
}
