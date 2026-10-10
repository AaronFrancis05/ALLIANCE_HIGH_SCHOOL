/**
 * The top of the admin dashboard: who is signed in, what their role is for, and shortcuts
 * to the jobs that role does most. The menu and the cards below already show only the
 * sections the role can work in (hiddenUnless in src/access/roles.ts).
 *
 * Shortcuts are links only. Every one still goes through the collection's access rules.
 */

import React from 'react'
import Link from 'next/link'
import type { ServerProps } from 'payload'
import { ROLE_LABELS, isStaff, type StaffRole, type StaffUser } from '../../access/roles'

interface Shortcut {
  label: string
  href: string
}

const ROLE_GUIDE: Record<StaffRole, { summary: string; shortcuts: Shortcut[] }> = {
  superAdmin: {
    summary: 'You manage staff accounts and can reach every part of the website.',
    shortcuts: [
      { label: 'Invite a staff member', href: '/admin/collections/users/create' },
      { label: 'Staff accounts', href: '/admin/collections/users' },
      { label: 'Audit log', href: '/admin/collections/auditLogs' },
      { label: 'Site settings', href: '/admin/globals/siteSettings' },
    ],
  },
  editor: {
    summary: 'You publish news, events, photos and the pages of the public website.',
    shortcuts: [
      { label: 'Write a news story', href: '/admin/collections/posts/create' },
      { label: 'Add an event', href: '/admin/collections/events/create' },
      { label: 'New photo album', href: '/admin/collections/albums/create' },
      { label: 'Home page', href: '/admin/globals/homePage' },
    ],
  },
  hod: {
    summary: 'You keep your department’s e-Library shelf and can write news stories.',
    shortcuts: [
      { label: 'Upload to the e-Library', href: '/admin/collections/resources/create' },
      { label: 'Library resources', href: '/admin/collections/resources' },
      { label: 'Write a news story', href: '/admin/collections/posts/create' },
    ],
  },
  registrar: {
    summary: 'You keep student records, academic terms and report cards.',
    shortcuts: [
      { label: 'Add a student', href: '/admin/collections/students/create' },
      { label: 'Students', href: '/admin/collections/students' },
      { label: 'Upload a report card', href: '/admin/collections/reportCards/create' },
      { label: 'Terms and releases', href: '/admin/collections/academicTerms' },
    ],
  },
  bursar: {
    summary: 'You record which students are cleared to see their report cards.',
    shortcuts: [
      { label: 'Fee clearances', href: '/admin/collections/feeClearances' },
      { label: 'Record a clearance', href: '/admin/collections/feeClearances/create' },
      { label: 'Fee structure downloads', href: '/admin/collections/downloads' },
    ],
  },
  admissions: {
    summary: 'You review applications and answer enquiries from families.',
    shortcuts: [
      { label: 'Applications', href: '/admin/collections/applications' },
      { label: 'Enquiries', href: '/admin/collections/formSubmissions' },
      { label: 'Admissions settings', href: '/admin/globals/admissionsSettings' },
    ],
  },
  teacher: {
    summary: 'You can write news stories and add photo albums for the website.',
    shortcuts: [
      { label: 'Write a news story', href: '/admin/collections/posts/create' },
      { label: 'New photo album', href: '/admin/collections/albums/create' },
    ],
  },
}

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
  if (!isStaff(staff) || !staff.role) return null

  const guide = ROLE_GUIDE[staff.role]
  const firstName = staff.name?.split(' ')[0]

  return (
    <section className="ahsn-welcome" aria-labelledby="ahsn-welcome-title">
      <div className="ahsn-welcome__intro">
        <p className="ahsn-welcome__role">{ROLE_LABELS[staff.role]}</p>
        <h2 id="ahsn-welcome-title" className="ahsn-welcome__title">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </h2>
        <p className="ahsn-welcome__summary">{guide.summary}</p>
      </div>
      <nav className="ahsn-welcome__shortcuts" aria-label="Shortcuts">
        {guide.shortcuts.map((shortcut) => (
          <Link key={shortcut.href} href={shortcut.href} className="ahsn-welcome__shortcut">
            {shortcut.label}
          </Link>
        ))}
      </nav>
    </section>
  )
}
