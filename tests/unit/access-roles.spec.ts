/**
 * Proves the role helpers deny by default (FR-05, AGENTS.md section 5).
 *
 * The negative cases matter more than the positive ones: an anonymous visitor, a
 * deactivated account and a student session must never satisfy a staff check.
 */

import { describe, expect, it } from 'vitest'
import {
  anyone,
  canUseAdminScreens,
  denyAll,
  departmentId,
  hasRole,
  hiddenUnless,
  hiddenUnlessSuperAdmin,
  isStaff,
  isStudent,
  isSuperAdmin,
  mayUseAdminSignIn,
  publishedOrStaff,
  roles,
  rolesOf,
  staffOnly,
  superAdminOnly,
  type StaffUser,
  type StudentUser,
} from '../../src/access/roles'
import { staffUser, type StaffAs } from '../helpers/staff'

const staff = (as: StaffAs = 'teacher', overrides: Partial<StaffUser> = {}): StaffUser => staffUser(as, overrides)

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
    expect(isStaff(staff('teacher', { active: false }))).toBe(false)
  })

  it('rejects a student session, whatever it claims', () => {
    expect(isStaff(student())).toBe(false)
    expect(isStaff({ ...student(), accountType: 'superAdmin' } as unknown as StaffUser)).toBe(false)
    expect(isSuperAdmin({ ...student(), accountType: 'superAdmin' } as unknown as StaffUser)).toBe(false)
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
    expect(hasRole(staff('bursar'), 'bursar')).toBe(true)
    expect(hasRole(staff('bursar'), 'secretary', 'bursar')).toBe(true)
  })

  it('refuses a role that was not listed', () => {
    expect(hasRole(staff('teacher'), 'secretary')).toBe(false)
    expect(hasRole(staff('bursar'), 'secretary')).toBe(false)
  })

  it('adds up several roles: each one counts, none borrows from another', () => {
    const teacherEditor = staff(['teacher', 'editor'])
    expect(hasRole(teacherEditor, 'teacher')).toBe(true)
    expect(hasRole(teacherEditor, 'editor')).toBe(true)
    expect(hasRole(teacherEditor, 'bursar', 'secretary')).toBe(false)
  })

  it('lets the super admin through everywhere', () => {
    expect(hasRole(staff('superAdmin'), 'bursar')).toBe(true)
    expect(hasRole(staff('superAdmin'))).toBe(true)
  })

  it('refuses a deactivated super admin', () => {
    expect(hasRole(staff('superAdmin', { active: false }), 'bursar')).toBe(false)
  })

  it('refuses staff with no role at all, and lists nothing for them', () => {
    expect(hasRole(staff(null), 'teacher')).toBe(false)
    expect(hasRole(staff('teacher', { roles: null }), 'teacher')).toBe(false)
    expect(rolesOf(staff(null))).toEqual([])
  })

  it('never treats "superAdmin" in the roles list as the super admin', () => {
    const forged = staff(null, { roles: ['superAdmin'] as unknown as StaffUser['roles'] })
    expect(isSuperAdmin(forged)).toBe(false)
    expect(hasRole(forged, 'bursar')).toBe(false)
    expect(rolesOf(forged)).toEqual([])
  })

  it('ignores the old merged role names', () => {
    const old = staff(null, { roles: ['registrar', 'admissions'] as unknown as StaffUser['roles'] })
    expect(hasRole(old, 'secretary', 'bursar')).toBe(false)
  })
})

describe('the two doors', () => {
  it('opens the admin sign-in to the super admin only', () => {
    expect(mayUseAdminSignIn(staff('superAdmin'))).toBe(true)
    for (const as of ['editor', 'secretary', 'bursar', 'hod', 'teacher', null] as const) {
      expect(mayUseAdminSignIn(staff(as)), String(as)).toBe(false)
    }
    expect(mayUseAdminSignIn(staff('superAdmin', { active: false }))).toBe(false)
  })

  it('opens the admin screens to the super admin and to staff with a role', () => {
    expect(canUseAdminScreens(staff('superAdmin'))).toBe(true)
    expect(canUseAdminScreens(staff('bursar'))).toBe(true)
    expect(canUseAdminScreens(staff(['teacher', 'editor']))).toBe(true)
  })

  it('keeps staff with no role, deactivated staff, students and visitors out of the admin screens', () => {
    expect(canUseAdminScreens(staff(null))).toBe(false)
    expect(canUseAdminScreens(staff('editor', { active: false }))).toBe(false)
    expect(canUseAdminScreens(student())).toBe(false)
    expect(canUseAdminScreens(null)).toBe(false)
  })
})

describe('admin menu', () => {
  it('shows a section to the roles listed and the super admin, and hides it from the rest', () => {
    const fees = hiddenUnless('bursar')
    expect(fees({ user: staff('bursar') })).toBe(false)
    expect(fees({ user: staff(['teacher', 'bursar']) })).toBe(false)
    expect(fees({ user: staff('superAdmin') })).toBe(false)
    expect(fees({ user: staff('editor') })).toBe(true)
    expect(fees({ user: staff(null) })).toBe(true)
  })

  it('shows super-admin sections to the super admin only', () => {
    expect(hiddenUnlessSuperAdmin({ user: staff('superAdmin') })).toBe(false)
    expect(hiddenUnlessSuperAdmin({ user: staff(['editor', 'secretary', 'bursar', 'hod', 'teacher']) })).toBe(true)
  })
})

describe('departmentId', () => {
  it('reads a plain id and a populated relationship alike', () => {
    expect(departmentId(staff('hod', { department: 4 }))).toBe(4)
    expect(departmentId(staff('hod', { department: { id: 4 } }))).toBe(4)
  })

  it('returns null when there is no department', () => {
    expect(departmentId(staff())).toBeNull()
    expect(departmentId(null)).toBeNull()
    expect(departmentId(student())).toBeNull()
  })
})

describe('collection access helpers', () => {
  it('denyAll refuses even the super admin', () => {
    expect(denyAll(req(staff('superAdmin')))).toBe(false)
  })

  it('anyone allows an anonymous visitor', () => {
    expect(anyone(req(null))).toBe(true)
  })

  it('staffOnly lets in any active staff, with or without a role, and refuses students and visitors', () => {
    expect(staffOnly(req(staff()))).toBe(true)
    expect(staffOnly(req(staff(null)))).toBe(true)
    expect(staffOnly(req(student()))).toBe(false)
    expect(staffOnly(req(null))).toBe(false)
  })

  it('roles() grants only the listed roles', () => {
    const editorsOnly = roles('editor')
    expect(editorsOnly(req(staff('editor')))).toBe(true)
    expect(editorsOnly(req(staff('teacher')))).toBe(false)
    expect(editorsOnly(req(staff(null)))).toBe(false)
    expect(editorsOnly(req(null))).toBe(false)
  })

  it('superAdminOnly grants nobody else', () => {
    expect(superAdminOnly(req(staff('superAdmin')))).toBe(true)
    expect(superAdminOnly(req(staff(['editor', 'secretary', 'bursar', 'hod', 'teacher'])))).toBe(false)
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
