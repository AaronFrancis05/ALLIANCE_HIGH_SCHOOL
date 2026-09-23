/**
 * Proves the role helpers deny by default (FR-05, AGENTS.md section 5).
 *
 * The negative cases matter more than the positive ones: an anonymous visitor, a
 * deactivated account and a student session must never satisfy a staff check.
 */

import { describe, expect, it } from 'vitest'
import {
  anyone,
  denyAll,
  departmentId,
  hasRole,
  isStaff,
  isStudent,
  publishedOrStaff,
  roles,
  staffOnly,
  superAdminOnly,
  type StaffUser,
  type StudentUser,
} from '../../src/access/roles'

const staff = (overrides: Partial<StaffUser> = {}): StaffUser => ({
  id: 1,
  collection: 'users',
  role: 'teacher',
  active: true,
  ...overrides,
})

const student = (overrides: Partial<StudentUser> = {}): StudentUser => ({
  id: 9,
  collection: 'students',
  status: 'active',
  ...overrides,
})

/** Payload passes access rules a request object; only `user` is consulted. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (user: unknown): any => ({ req: { user } })

describe('isStaff', () => {
  it('accepts an active staff account', () => {
    expect(isStaff(staff())).toBe(true)
  })

  it('rejects an anonymous visitor', () => {
    expect(isStaff(null)).toBe(false)
    expect(isStaff(undefined)).toBe(false)
  })

  it('rejects a deactivated account', () => {
    expect(isStaff(staff({ active: false }))).toBe(false)
  })

  it('rejects a student session, whatever it claims', () => {
    expect(isStaff(student())).toBe(false)
    expect(isStaff({ ...student(), role: 'superAdmin' } as unknown as StaffUser)).toBe(false)
  })
})

describe('isStudent', () => {
  it('accepts a student and rejects staff', () => {
    expect(isStudent(student())).toBe(true)
    expect(isStudent(staff())).toBe(false)
    expect(isStudent(null)).toBe(false)
  })
})

describe('hasRole', () => {
  it('matches the listed roles', () => {
    expect(hasRole(staff({ role: 'bursar' }), 'bursar')).toBe(true)
    expect(hasRole(staff({ role: 'bursar' }), 'registrar', 'bursar')).toBe(true)
  })

  it('refuses a role that was not listed', () => {
    expect(hasRole(staff({ role: 'teacher' }), 'registrar')).toBe(false)
    expect(hasRole(staff({ role: 'bursar' }), 'registrar')).toBe(false)
  })

  it('lets the super admin through everywhere', () => {
    expect(hasRole(staff({ role: 'superAdmin' }), 'bursar')).toBe(true)
  })

  it('refuses a deactivated super admin', () => {
    expect(hasRole(staff({ role: 'superAdmin', active: false }), 'bursar')).toBe(false)
  })

  it('refuses a user with no role at all', () => {
    expect(hasRole(staff({ role: undefined }), 'teacher')).toBe(false)
  })
})

describe('departmentId', () => {
  it('reads a plain id and a populated relationship alike', () => {
    expect(departmentId(staff({ department: 4 }))).toBe(4)
    expect(departmentId(staff({ department: { id: 4 } }))).toBe(4)
  })

  it('returns null when there is no department', () => {
    expect(departmentId(staff())).toBeNull()
    expect(departmentId(null)).toBeNull()
    expect(departmentId(student())).toBeNull()
  })
})

describe('collection access helpers', () => {
  it('denyAll refuses even the super admin', () => {
    expect(denyAll(req(staff({ role: 'superAdmin' })))).toBe(false)
  })

  it('anyone allows an anonymous visitor', () => {
    expect(anyone(req(null))).toBe(true)
  })

  it('staffOnly refuses students and visitors', () => {
    expect(staffOnly(req(staff()))).toBe(true)
    expect(staffOnly(req(student()))).toBe(false)
    expect(staffOnly(req(null))).toBe(false)
  })

  it('roles() grants only the listed roles', () => {
    const editorsOnly = roles('editor')
    expect(editorsOnly(req(staff({ role: 'editor' })))).toBe(true)
    expect(editorsOnly(req(staff({ role: 'teacher' })))).toBe(false)
    expect(editorsOnly(req(null))).toBe(false)
  })

  it('superAdminOnly grants nobody else', () => {
    expect(superAdminOnly(req(staff({ role: 'superAdmin' })))).toBe(true)
    expect(superAdminOnly(req(staff({ role: 'registrar' })))).toBe(false)
  })
})

describe('publishedOrStaff', () => {
  it('gives staff everything', () => {
    expect(publishedOrStaff(req(staff()))).toBe(true)
  })

  it('limits a visitor to published documents', () => {
    expect(publishedOrStaff(req(null))).toEqual({ _status: { equals: 'published' } })
  })

  it('limits a student to published documents, so drafts never leak', () => {
    expect(publishedOrStaff(req(student()))).toEqual({ _status: { equals: 'published' } })
  })
})
