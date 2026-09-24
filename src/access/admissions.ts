/**
 * Who may see admissions records (FR-16 to FR-19).
 *
 * Applications and their documents hold a child's identity papers, so only the admissions
 * team (and the super admin, who can reach everything) may read them. Nobody else on the
 * staff, and never a student or the public. Public forms write through server routes that
 * make their own checks, so create is denied here.
 */

import type { Access } from 'payload'
import { hasRole, type StaffUser, type StudentUser } from './roles'
import { canMoveStatus } from '../lib/application-status'

type AnyUser = StaffUser | StudentUser | null | undefined

/** May this person open applications and their documents? */
export function isAdmissionsTeam(user: AnyUser): boolean {
  return hasRole(user, 'admissions')
}

export const readAdmissions: Access = ({ req }) => isAdmissionsTeam(req.user as AnyUser)

/** The same rule, for the route that hands out a document's signed link. */
export function canOpenApplicationDocument(user: AnyUser): boolean {
  return isAdmissionsTeam(user)
}

/**
 * May this person move an application from one stage to another (FR-19)? The admissions
 * team may take the allowed next steps; only the super admin may go anywhere else, which is
 * how a decision made by mistake is reversed.
 */
export function canChangeApplicationStatus(user: AnyUser, from: string, to: string): boolean {
  if (!isAdmissionsTeam(user)) return false
  if (canMoveStatus(from, to)) return true
  return (user as StaffUser).role === 'superAdmin'
}
