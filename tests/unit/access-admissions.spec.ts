/**
 * Only the bursar, who runs admissions, and the super admin may open applications and their
 * documents (FR-17, AGENTS.md rule 3).
 */

import { describe, expect, it } from 'vitest'
import { canOpenApplicationDocument, isAdmissionsTeam } from '../../src/access/admissions'
import type { StaffRole, StudentUser } from '../../src/access/roles'
import { staffUser, type StaffAs } from '../helpers/staff'

const staff = (as: StaffAs, active = true) => staffUser(as, { active })

const student = { id: 7, collection: 'students', status: 'active' } as unknown as StudentUser

describe('admissions access', () => {
  it('lets the bursar and the super admin in', () => {
    expect(isAdmissionsTeam(staff('bursar'))).toBe(true)
    expect(canOpenApplicationDocument(staff('superAdmin'))).toBe(true)
  })

  it('lets in someone who holds the bursar role among others', () => {
    expect(canOpenApplicationDocument(staff(['teacher', 'bursar']))).toBe(true)
  })

  it('turns away every other staff role, and staff with no role', () => {
    for (const role of ['editor', 'secretary', 'hod', 'teacher'] as StaffRole[]) {
      expect(canOpenApplicationDocument(staff(role))).toBe(false)
    }
    expect(canOpenApplicationDocument(staff(null))).toBe(false)
  })

  it('turns away a deactivated bursar', () => {
    expect(canOpenApplicationDocument(staff('bursar', false))).toBe(false)
  })

  it('turns away students and the public', () => {
    expect(canOpenApplicationDocument(student)).toBe(false)
    expect(canOpenApplicationDocument(null)).toBe(false)
    expect(canOpenApplicationDocument(undefined)).toBe(false)
  })
})
