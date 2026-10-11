/**
 * Staff roles and the small helpers every access rule is built from.
 *
 * Rules start from "no" and grant deliberately (FR-05). Nothing outside this folder
 * decides who may read or write a collection.
 */

import type { Access, FieldAccess } from 'payload'

/**
 * What a staff member may work on, beyond the base staff access every account has. A person
 * can hold several; permissions add up. The super admin is not a role but an account type
 * (below), so it can never be granted alongside a position.
 */
export const STAFF_ROLES = ['editor', 'secretary', 'bursar', 'hod', 'teacher'] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

export const ROLE_LABELS: Record<StaffRole, string> = {
  editor: 'Content Manager',
  secretary: 'School Secretary',
  bursar: 'Bursar',
  hod: 'Head of Department',
  teacher: 'Teacher',
}

/**
 * The super admin (ICT) reaches everything and signs in at /admin. Every other account is
 * staff, signs in at /staff and holds only the roles it has been granted.
 */
export const ACCOUNT_TYPES = ['staff', 'superAdmin'] as const

export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  staff: 'Staff',
  superAdmin: 'Super Admin (ICT)',
}

/** Shape of the authenticated user as far as access rules care. */
export interface StaffUser {
  id: string | number
  collection: 'users'
  accountType?: AccountType | null
  roles?: StaffRole[] | null
  department?: string | number | { id: string | number } | null
  subjects?: (string | number | { id: string | number })[] | null
  active?: boolean | null
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

export function isSuperAdmin(user: AnyUser): boolean {
  return isStaff(user) && user.accountType === 'superAdmin'
}

/** The roles an active staff account holds, ignoring anything that is not a known role. */
export function rolesOf(user: AnyUser): StaffRole[] {
  if (!isStaff(user) || !Array.isArray(user.roles)) return []
  return user.roles.filter((role): role is StaffRole => (STAFF_ROLES as readonly string[]).includes(role))
}

/** True for the super admin, or for staff holding any one of these roles. */
export function hasRole(user: AnyUser, ...allowed: StaffRole[]): boolean {
  if (isSuperAdmin(user)) return true // the super admin can reach everything
  return rolesOf(user).some((role) => allowed.includes(role))
}

/**
 * The admin screens are a workspace for the super admin and for staff who hold at least one
 * role. A staff member with no role has nothing to do there and uses the staff portal only.
 */
export function canUseAdminScreens(user: unknown): boolean {
  return isSuperAdmin(user as AnyUser) || rolesOf(user as AnyUser).length > 0
}

/** Only the super admin signs in at /admin; everyone else signs in at /staff. */
export function mayUseAdminSignIn(user: unknown): boolean {
  return isSuperAdmin(user as AnyUser)
}

/** Id of the department a head of department belongs to, if any. */
export function departmentId(user: AnyUser): string | number | null {
  if (!isStaff(user) || !user.department) return null
  return typeof user.department === 'object' ? user.department.id : user.department
}

/** Ids of the subjects a staff member teaches, as strings so ids of either type compare. */
export function subjectIds(user: AnyUser): string[] {
  if (!isStaff(user) || !Array.isArray(user.subjects)) return []
  return user.subjects.map((subject) => String(typeof subject === 'object' ? subject.id : subject))
}

// ---------------------------------------------------------------- collection access

export const denyAll: Access = () => false

export const anyone: Access = () => true

export const staffOnly: Access = ({ req }) => isStaff(req.user as AnyUser)

export function roles(...allowed: StaffRole[]): Access {
  return ({ req }) => hasRole(req.user as AnyUser, ...allowed)
}

export const superAdminOnly: Access = ({ req }) => isSuperAdmin(req.user as AnyUser)

/** Staff accounts the super admin may delete: anyone's but their own. */
export const deleteOtherStaff: Access = ({ req }) => {
  const user = req.user as AnyUser
  if (!isSuperAdmin(user)) return false
  return { id: { not_equals: user!.id } }
}

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

export const fieldSuperAdminOnly: FieldAccess = ({ req }) => isSuperAdmin(req.user as AnyUser)

/**
 * A staff account's role and active flag. Only the super admin changes them, and only on
 * someone else's account: nobody promotes themselves, and a super admin cannot demote or
 * deactivate themselves and leave the school with no one to manage staff. Another super
 * admin can.
 */
export const fieldSuperAdminOnOthers: FieldAccess = ({ req, id }) =>
  isSuperAdmin(req.user as AnyUser) && id !== undefined && String(req.user!.id) !== String(id)

/**
 * Passwords are never typed in for someone else. New staff set theirs from an invitation
 * and students from first-time sign-in, so nobody else ever knows them. A staff member may
 * change their own from the account page.
 */
export const passwordNeverOnCreate: FieldAccess = () => false

export const ownPasswordOnly: FieldAccess = ({ req, id }) =>
  isStaff(req.user as AnyUser) && id !== undefined && String(req.user!.id) === String(id)

// ---------------------------------------------------------------- admin navigation

/**
 * Hides a collection or global from the admin menu and dashboard unless the signed-in staff
 * member holds one of these roles, so each role sees only the work it can do.
 *
 * This is only what the menu shows. The access functions above still decide every read
 * and write, so hiding a section never grants or removes a permission.
 */
export function hiddenUnless(...allowed: StaffRole[]) {
  return ({ user }: { user: unknown }): boolean => !hasRole(user as AnyUser, ...allowed)
}

/** Shows a section to the super admin only, such as staff accounts and the audit log. */
export function hiddenUnlessSuperAdmin({ user }: { user: unknown }): boolean {
  return !isSuperAdmin(user as AnyUser)
}

// ---------------------------------------------------------------- staff invitations

/** Only the super admin adds staff, and so only the super admin sends invitations. */
export function canInviteStaff(user: unknown): boolean {
  return isSuperAdmin(user as AnyUser)
}
