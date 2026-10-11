/**
 * Staff portal home (FR-05).
 *
 * Shows the staff member their roles and a card for each, with shortcuts into the admin
 * screens where that work is done. The shortcuts are links only: the admin's access rules
 * still decide every read and write. A staff member with no role sees their profile and
 * the directory, and is told whom to ask for more.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookUser, UserRound } from 'lucide-react'
import { Container, Card, Badge } from '../../../components/ui'
import { requirePortalStaff } from '../../../lib/session'
import { guidesFor } from '../../../lib/role-guide'

export const metadata: Metadata = { title: 'Home' }

export default async function StaffHomePage() {
  const staff = await requirePortalStaff()
  const guides = guidesFor({ ...staff, collection: 'users' })
  const firstName = staff.name?.split(' ')[0]

  return (
    <Container className="max-w-4xl">
      <h1 className="text-3xl">Hello{firstName ? `, ${firstName}` : ''}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>Staff</Badge>
        {guides.map((guide) => (
          <Badge key={guide.title}>{guide.title}</Badge>
        ))}
      </div>

      {guides.length ? (
        <section aria-labelledby="work-heading" className="mt-10">
          <h2 id="work-heading" className="text-xl">
            Your work
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {guides.map((guide) => (
              <Card key={guide.title} className="p-6">
                <h3 className="text-lg">{guide.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{guide.summary}</p>
                <ul className="mt-4 space-y-1">
                  {guide.shortcuts.map((shortcut) => (
                    <li key={shortcut.href}>
                      <Link
                        href={shortcut.href}
                        className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-2 text-sm font-medium text-maroon-700 hover:bg-maroon-50"
                      >
                        {shortcut.label}
                        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <Card className="mt-10 p-6">
          <p className="text-sm text-[var(--text-muted)]">
            Your account does not have a role yet, so there is no work area to open. If you need to publish
            news, keep records or manage fees, ask the ICT office to give your account the right role.
          </p>
        </Card>
      )}

      <section aria-label="Your account" className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/staff/profile" className="block rounded-[var(--radius-card)] focus-visible:ring-2 focus-visible:ring-maroon-600">
          <Card className="flex h-full items-center gap-4 p-6 hover:border-maroon-300">
            <UserRound className="h-6 w-6 shrink-0 text-maroon-700" aria-hidden />
            <span>
              <span className="block font-semibold text-[var(--text-strong)]">Your profile</span>
              <span className="block text-sm text-[var(--text-muted)]">Your name and password</span>
            </span>
          </Card>
        </Link>
        <Link href="/staff/directory" className="block rounded-[var(--radius-card)] focus-visible:ring-2 focus-visible:ring-maroon-600">
          <Card className="flex h-full items-center gap-4 p-6 hover:border-maroon-300">
            <BookUser className="h-6 w-6 shrink-0 text-maroon-700" aria-hidden />
            <span>
              <span className="block font-semibold text-[var(--text-strong)]">Staff directory</span>
              <span className="block text-sm text-[var(--text-muted)]">Colleagues and their roles</span>
            </span>
          </Card>
        </Link>
      </section>
    </Container>
  )
}
