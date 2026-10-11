/**
 * What each role is for, and shortcuts to the jobs it does most (FR-05).
 *
 * Shown on the staff portal home and at the top of the admin dashboard. These are links
 * only: every one still goes through the collection's access rules, so a shortcut never
 * grants anything. Who may do what is decided in src/access/.
 */

import { ROLE_LABELS, isSuperAdmin, rolesOf, type StaffRole, type StaffUser } from '../access/roles'

export interface Shortcut {
  label: string
  href: string
}

export interface RoleGuide {
  title: string
  summary: string
  shortcuts: Shortcut[]
}

export const SUPER_ADMIN_GUIDE: RoleGuide = {
  title: 'Super Admin (ICT)',
  summary: 'You manage staff accounts and can reach every part of the website.',
  shortcuts: [
    { label: 'Invite a staff member', href: '/admin/collections/users/create' },
    { label: 'Staff accounts', href: '/admin/collections/users' },
    { label: 'Audit log', href: '/admin/collections/auditLogs' },
    { label: 'Site settings', href: '/admin/globals/siteSettings' },
  ],
}

const ROLE_GUIDE: Record<StaffRole, Omit<RoleGuide, 'title'>> = {
  editor: {
    summary: 'You publish news, notices, events, photos and the pages of the public website, and answer enquiries.',
    shortcuts: [
      { label: 'Write a news story', href: '/admin/collections/posts/create' },
      { label: 'Add an event', href: '/admin/collections/events/create' },
      { label: 'New photo album', href: '/admin/collections/albums/create' },
      { label: 'Home page', href: '/admin/globals/homePage' },
      { label: 'Enquiries', href: '/admin/collections/formSubmissions' },
    ],
  },
  secretary: {
    summary: 'You keep student records, academic terms and report cards, and release each term’s results.',
    shortcuts: [
      { label: 'Add a student', href: '/admin/collections/students/create' },
      { label: 'Students', href: '/admin/collections/students' },
      { label: 'Upload a report card', href: '/admin/collections/reportCards/create' },
      { label: 'Terms and releases', href: '/admin/collections/academicTerms' },
    ],
  },
  bursar: {
    summary: 'You record fee clearances, run admissions and answer enquiries from families.',
    shortcuts: [
      { label: 'Fee clearances', href: '/admin/collections/feeClearances' },
      { label: 'Record a clearance', href: '/admin/collections/feeClearances/create' },
      { label: 'Applications', href: '/admin/collections/applications' },
      { label: 'Enquiries', href: '/admin/collections/formSubmissions' },
      { label: 'Admissions settings', href: '/admin/globals/admissionsSettings' },
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
  teacher: {
    summary: 'You set holiday work for your subjects, and can write news stories and add photo albums.',
    shortcuts: [
      { label: 'Upload holiday work', href: '/admin/collections/resources/create' },
      { label: 'Write a news story', href: '/admin/collections/posts/create' },
      { label: 'New photo album', href: '/admin/collections/albums/create' },
    ],
  },
}

/** One guide per role this person holds, in the order roles are listed; the super admin gets one. */
export function guidesFor(user: unknown): RoleGuide[] {
  if (isSuperAdmin(user as StaffUser)) return [SUPER_ADMIN_GUIDE]
  return rolesOf(user as StaffUser).map((role) => ({ title: ROLE_LABELS[role], ...ROLE_GUIDE[role] }))
}

/** Every shortcut across someone's roles, each link once. */
export function shortcutsFor(user: unknown): Shortcut[] {
  const seen = new Set<string>()
  return guidesFor(user)
    .flatMap((guide) => guide.shortcuts)
    .filter((shortcut) => (seen.has(shortcut.href) ? false : (seen.add(shortcut.href), true)))
}
