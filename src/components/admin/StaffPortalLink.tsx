/**
 * At the foot of the admin menu, for staff who came in through the staff portal: the way
 * back to it. The super admin, whose door is /admin, does not see it.
 */

import React from 'react'
import Link from 'next/link'
import type { ServerProps } from 'payload'
import { isStaff, isSuperAdmin, type StaffUser } from '../../access/roles'

export function StaffPortalLink({ user }: ServerProps) {
  const staff = user as unknown as StaffUser | null
  if (!isStaff(staff) || isSuperAdmin(staff)) return null

  return (
    <Link href="/staff" className="nav__link ahsn-staff-portal-link">
      <span className="nav__link-label">Back to the staff portal</span>
    </Link>
  )
}
