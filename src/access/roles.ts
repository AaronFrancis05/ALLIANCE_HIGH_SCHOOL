/**
 * Staff roles and the small helpers every access rule is built from.
 *
 * Rules start from "no" and grant deliberately (FR-05). Nothing outside this folder
 * decides who may read or write a collection.
 */

import type { Access, FieldAccess } from 'payload'

export const STAFF_ROLES = [
  'superAdmin',
  'editor',
  'hod',
  'registrar',
  'bursar',
  'admissions',
  'teacher',
] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

export const ROLE_LABELS: Record<StaffRole, string> = {
  superAdmin: 'Super Admin (ICT)',
  editor: 'Content Editor',
  hod: 'Head of Department',
  registrar: 'Academic Registrar / DOS',
  bursar: 'Bursar',
  admissions: 'Admissions Officer',
  teacher: 'Teacher',
}

/** Shape of the authenticated user as far as access rules care. */
export interface StaffUser {
  id: string | number
  collection: 'users'
  role?: StaffRole
  department?: string | number | { id: string | number } | null
  active?: boolean
}

export interface StudentUser {
  id: string | number
  collection: 'students'
  status?: 'active' | 'suspended' | 'alumni'
}

type AnyUser = StaffUser | StudentUser | null | undefined

export function isStaff(user: AnyUser): user is StaffUser {
  return Boolean(user && user.collection === 'users' && (user as StaffUser).active !== false)
}

export function isStudent(user: AnyUser): user is StudentUser {
  return Boolean(user && user.collection === 'students')
}

export function hasRole(user: AnyUser, ...roles: StaffRole[]): boolean {
  if (!isStaff(user)) return false
  if (user.role === 'superAdmin') return true // the super admin can reach everything
  return Boolean(user.role && roles.includes(user.role))
}

/** Id of the department a head of department belongs to, if any. */
export function departmentId(user: AnyUser): string | number | null {
  if (!isStaff(user) || !user.department) return null
  return typeof user.department === 'object' ? user.department.id : user.department
}

// ---------------------------------------------------------------- collection access

export const denyAll: Access = () => false

export const anyone: Access = () => true

export const staffOnly: Access = ({ req }) => isStaff(req.user as AnyUser)

export function roles(...allowed: StaffRole[]): Access {
  return ({ req }) => hasRole(req.user as AnyUser, ...allowed)
}

export const superAdminOnly: Access = ({ req }) => hasRole(req.user as AnyUser, 'superAdmin')

/** Published content is public; drafts stay with the staff who can edit them. */
export const publishedOrStaff: Access = ({ req }) => {
  if (isStaff(req.user as AnyUser)) return true
  return {
    _status: { equals: 'published' },
  }
}

// ---------------------------------------------------------------- field access

export function fieldRoles(...allowed: StaffRole[]): FieldAccess {
  return ({ req }) => hasRole(req.user as AnyUser, ...allowed)
}

export const fieldSuperAdminOnly: FieldAccess = ({ req }) => hasRole(req.user as AnyUser, 'superAdmin')
