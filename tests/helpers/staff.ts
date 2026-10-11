import type { StaffRole, StaffUser } from '../../src/access/roles'

/** Who a test acts as: the super admin, staff with one or more roles, or staff with none. */
export type StaffAs = 'superAdmin' | StaffRole | StaffRole[] | null

/** An active staff account for access-rule tests. */
export function staffUser(as: StaffAs, overrides: Partial<StaffUser> = {}): StaffUser {
  const superAdmin = as === 'superAdmin'
  const roles: StaffRole[] = superAdmin || as === null ? [] : Array.isArray(as) ? as : [as]
  return {
    id: 1,
    collection: 'users',
    accountType: superAdmin ? 'superAdmin' : 'staff',
    roles,
    active: true,
    ...overrides,
  }
}
