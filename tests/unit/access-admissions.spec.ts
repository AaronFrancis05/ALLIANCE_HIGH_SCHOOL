/**
 * Only the admissions team may open applications and their documents (FR-17, AGENTS.md rule 3).
 */

import { describe, expect, it } from 'vitest'
import { canOpenApplicationDocument, isAdmissionsTeam } from '../../src/access/admissions'
import type { StaffRole, StaffUser, StudentUser } from '../../src/access/roles'

const staff = (role: StaffRole, active = true) =>
  ({ id: 1, collection: 'users', role, active }) as unknown as StaffUser

const student = { id: 7, collection: 'students', status: 'active' } as unknown as StudentUser

describe('admissions access', () => {
  it('lets the admissions officer and the super admin in', () => {
    expect(isAdmissionsTeam(staff('admissions'))).toBe(true)
    expect(canOpenApplicationDocument(staff('superAdmin'))).toBe(true)
  })

  it('turns away every other staff role', () => {
    for (const role of ['editor', 'registrar', 'bursar', 'hod', 'teacher'] as StaffRole[]) {
      expect(canOpenApplicationDocument(staff(role))).toBe(false)
    }
  })

  it('turns away a deactivated admissions officer', () => {
    expect(canOpenApplicationDocument(staff('admissions', false))).toBe(false)
  })

  it('turns away students and the public', () => {
    expect(canOpenApplicationDocument(student)).toBe(false)
    expect(canOpenApplicationDocument(null)).toBe(false)
    expect(canOpenApplicationDocument(undefined)).toBe(false)
  })
})
