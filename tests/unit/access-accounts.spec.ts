/**
 * Who may manage accounts, set passwords and see each admin section (FR-05, FR-10).
 *
 * The refusals matter most: nobody types a password for someone else, only the super admin
 * invites staff, students change nothing about their own record, and a role never sees a
 * section it cannot work in.
 */

import { describe, expect, it } from 'vitest'
import {
  canInviteStaff,
  hiddenUnless,
  ownPasswordOnly,
  passwordNeverOnCreate,
  type StaffUser,
  type StudentUser,
} from '../../src/access/roles'
import { canKeepStudentRecords, manageStudents, readStudents } from '../../src/access/students'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const args = (user: unknown, id?: string | number): any => ({ req: { user }, id })

describe('passwords are never typed for someone else', () => {
  it('nobody can send a password when an account is created, not even the super admin', () => {
    expect(passwordNeverOnCreate(args(staff({ role: 'superAdmin' })))).toBe(false)
    expect(passwordNeverOnCreate(args(staff({ role: 'registrar' })))).toBe(false)
    expect(passwordNeverOnCreate(args(null))).toBe(false)
  })

  it('a staff member may change their own password', () => {
    expect(ownPasswordOnly(args(staff({ id: 4 }), 4))).toBe(true)
    expect(ownPasswordOnly(args(staff({ id: 4 }), '4'))).toBe(true)
  })

  it('the super admin cannot change another person’s password', () => {
    expect(ownPasswordOnly(args(staff({ id: 1, role: 'superAdmin' }), 4))).toBe(false)
  })

  it('a student, an anonymous visitor or a deactivated account cannot change a staff password', () => {
    expect(ownPasswordOnly(args(student({ id: 4 }), 4))).toBe(false)
    expect(ownPasswordOnly(args(null, 4))).toBe(false)
    expect(ownPasswordOnly(args(staff({ id: 4, active: false }), 4))).toBe(false)
  })

  it('refuses when there is no document id to compare with', () => {
    expect(ownPasswordOnly(args(staff({ id: 4 })))).toBe(false)
  })
})

describe('staff invitations', () => {
  it('only the super admin may invite', () => {
    expect(canInviteStaff(staff({ role: 'superAdmin' }))).toBe(true)
  })

  it('every other role, a student and an anonymous visitor are refused', () => {
    for (const role of ['editor', 'hod', 'registrar', 'bursar', 'admissions', 'teacher'] as const) {
      expect(canInviteStaff(staff({ role }))).toBe(false)
    }
    expect(canInviteStaff(student())).toBe(false)
    expect(canInviteStaff(null)).toBe(false)
  })

  it('a deactivated super admin is refused', () => {
    expect(canInviteStaff(staff({ role: 'superAdmin', active: false }))).toBe(false)
  })
})

describe('student records', () => {
  it('the registrar and the super admin keep them', () => {
    expect(canKeepStudentRecords(staff({ role: 'registrar' }))).toBe(true)
    expect(canKeepStudentRecords(staff({ role: 'superAdmin' }))).toBe(true)
    expect(manageStudents(args(staff({ role: 'registrar' })))).toBe(true)
  })

  it('other staff cannot create or change them', () => {
    for (const role of ['editor', 'hod', 'bursar', 'admissions', 'teacher'] as const) {
      expect(manageStudents(args(staff({ role })))).toBe(false)
    }
  })

  it('a student cannot change their own record, not even their admission number', () => {
    expect(manageStudents(args(student({ id: 9 }), 9))).toBe(false)
  })

  it('a student reads only their own record', () => {
    expect(readStudents(args(student({ id: 9 })))).toEqual({ id: { equals: 9 } })
  })

  it('an anonymous visitor reads nothing', () => {
    expect(readStudents(args(null))).toBe(false)
    expect(manageStudents(args(null))).toBe(false)
  })

  it('the content editor cannot read student records', () => {
    expect(readStudents(args(staff({ role: 'editor' })))).toBe(false)
  })
})

describe('admin menu shows each role only its own sections', () => {
  const studentsSection = hiddenUnless('registrar')

  it('shows a section to the roles that work in it', () => {
    expect(studentsSection({ user: staff({ role: 'registrar' }) })).toBe(false)
  })

  it('shows every section to the super admin', () => {
    expect(studentsSection({ user: staff({ role: 'superAdmin' }) })).toBe(false)
  })

  it('hides it from every other role', () => {
    expect(studentsSection({ user: staff({ role: 'editor' }) })).toBe(true)
    expect(studentsSection({ user: staff({ role: 'bursar' }) })).toBe(true)
  })

  it('hides it from a deactivated account, a student and nobody at all', () => {
    expect(studentsSection({ user: staff({ role: 'registrar', active: false }) })).toBe(true)
    expect(studentsSection({ user: student() })).toBe(true)
    expect(studentsSection({ user: null })).toBe(true)
  })
})
