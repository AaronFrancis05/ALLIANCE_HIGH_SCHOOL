/**
 * The top of the admin dashboard: who is signed in, what their roles are for, and shortcuts
 * to the jobs those roles do most (src/lib/role-guide.ts). The menu and the cards below
 * already show only the sections the roles can work in (hiddenUnless in src/access/roles.ts).
 *
 * Shortcuts are links only. Every one still goes through the collection's access rules.
 */

import React from 'react'
import Link from 'next/link'
import type { ServerProps } from 'payload'
import { isStaff, type StaffUser } from '../../access/roles'
import { guidesFor, shortcutsFor } from '../../lib/role-guide'

/** Morning, afternoon or evening in Kampala, whatever the server's own time zone. */
function greeting(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Africa/Kampala' }).format(now),
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Welcome({ user }: ServerProps) {
  const staff = user as unknown as (StaffUser & { name?: string }) | null
  if (!isStaff(staff)) return null

  const guides = guidesFor(staff)
  if (!guides.length) return null
  const firstName = staff.name?.split(' ')[0]

  return (
    <section className="ahsn-welcome" aria-labelledby="ahsn-welcome-title">
      <div className="ahsn-welcome__intro">
        <p className="ahsn-welcome__role">{guides.map((guide) => guide.title).join(' · ')}</p>
        <h2 id="ahsn-welcome-title" className="ahsn-welcome__title">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </h2>
        {guides.map((guide) => (
          <p key={guide.title} className="ahsn-welcome__summary">
            {guide.summary}
          </p>
        ))}
      </div>
      <nav className="ahsn-welcome__shortcuts" aria-label="Shortcuts">
        {shortcutsFor(staff).map((shortcut) => (
          <Link key={shortcut.href} href={shortcut.href} className="ahsn-welcome__shortcut">
            {shortcut.label}
          </Link>
        ))}
      </nav>
    </section>
  )
}
