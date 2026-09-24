/**
 * Proves the e-Library visibility rules (FR-06, FR-07, FR-08).
 *
 * The negative cases prove that a visitor cannot list a students-only item, that a
 * student cannot open another class's notes, and that a head of department cannot edit
 * another department's shelf.
 */

import { describe, expect, it } from 'vitest'
import {
  canFileInDepartment,
  canOpenResource,
  canStudentOpenResource,
  readResources,
  visibleResourcesWhere,
  writeResources,
} from '../../src/access/resources'
import type { StaffUser } from '../../src/access/roles'
import { titleFromFilename } from '../../src/lib/resource-title'

const staff = (role: StaffUser['role'], department?: number): StaffUser => ({
  id: 1,
  collection: 'users',
  role,
  active: true,
  department,
})

const student = (overrides: Record<string, unknown> = {}) => ({
  id: 9,
  collection: 'students' as const,
  status: 'active' as const,
  class: 'S4' as const,
  ...overrides,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (user: unknown): any => ({ req: { user } })

const PUBLIC_ONLY = { visibility: { equals: 'public' } }

describe('visibleResourcesWhere', () => {
  it('gives staff everything', () => {
    expect(visibleResourcesWhere(staff('editor'))).toEqual({})
  })

  it('limits an anonymous visitor to public items', () => {
    expect(visibleResourcesWhere(null)).toEqual(PUBLIC_ONLY)
  })

  it('limits a suspended student to public items', () => {
    expect(visibleResourcesWhere(student({ status: 'suspended' }))).toEqual(PUBLIC_ONLY)
  })

  it('limits an alumnus to public items', () => {
    expect(visibleResourcesWhere(student({ status: 'alumni' }))).toEqual(PUBLIC_ONLY)
  })

  it('lets an active student see public, student and their own class items', () => {
    const where = visibleResourcesWhere(student()) as { or: unknown[] }
    expect(where.or).toHaveLength(3)
    expect(JSON.stringify(where)).toContain('S4')
  })

  it('never matches a class-restricted item when the student has no class', () => {
    const where = visibleResourcesWhere(student({ class: undefined }))
    // The impossible clause keeps class-restricted rows out of the result set entirely.
    expect(JSON.stringify(where)).toContain('exists')
    expect(JSON.stringify(where)).not.toContain('contains')
  })
})

describe('readResources', () => {
  it('filters in the database rather than returning a blanket yes', () => {
    expect(readResources(req(null))).toEqual(PUBLIC_ONLY)
    expect(readResources(req(staff('teacher')))).toEqual({})
  })
})

describe('writeResources', () => {
  it('allows editors and registrars anywhere', () => {
    expect(writeResources(req(staff('editor')))).toBe(true)
    expect(writeResources(req(staff('registrar')))).toBe(true)
    expect(writeResources(req(staff('superAdmin')))).toBe(true)
  })

  it('confines a head of department to their own department', () => {
    expect(writeResources(req(staff('hod', 3)))).toEqual({ department: { equals: 3 } })
  })

  it('refuses a head of department who belongs to no department', () => {
    expect(writeResources(req(staff('hod')))).toBe(false)
  })

  it('refuses a teacher, a student and a visitor', () => {
    expect(writeResources(req(staff('teacher')))).toBe(false)
    expect(writeResources(req(student()))).toBe(false)
    expect(writeResources(req(null))).toBe(false)
  })
})

describe('canStudentOpenResource', () => {
  const s4 = student()

  it('opens a public item for anyone, signed in or not', () => {
    expect(canStudentOpenResource(null, { visibility: 'public' })).toBe(true)
    expect(canStudentOpenResource(s4, { visibility: 'public' })).toBe(true)
  })

  it('refuses a students-only item to a visitor', () => {
    expect(canStudentOpenResource(null, { visibility: 'students' })).toBe(false)
  })

  it('refuses a students-only item to a suspended student', () => {
    expect(canStudentOpenResource(student({ status: 'suspended' }), { visibility: 'students' })).toBe(false)
  })

  it('opens a class item for the right class only', () => {
    expect(canStudentOpenResource(s4, { visibility: 'classes', classes: ['S4'] })).toBe(true)
    expect(canStudentOpenResource(s4, { visibility: 'classes', classes: ['S5', 'S6'] })).toBe(false)
  })

  it('refuses a class item when the resource lists no classes', () => {
    expect(canStudentOpenResource(s4, { visibility: 'classes' })).toBe(false)
    expect(canStudentOpenResource(s4, { visibility: 'classes', classes: [] })).toBe(false)
  })

  it('refuses a class item when the student has no class recorded', () => {
    expect(canStudentOpenResource(student({ class: undefined }), { visibility: 'classes', classes: ['S4'] })).toBe(
      false,
    )
  })
})

describe('canOpenResource', () => {
  const restricted = { visibility: 'classes' as const, classes: ['S4' as const] }

  it('opens a public item for a visitor', () => {
    expect(canOpenResource(null, { visibility: 'public' })).toBe(true)
  })

  it('refuses every restricted item to a visitor', () => {
    expect(canOpenResource(null, { visibility: 'students' })).toBe(false)
    expect(canOpenResource(null, restricted)).toBe(false)
  })

  it('opens restricted items for active staff', () => {
    expect(canOpenResource(staff('teacher'), restricted)).toBe(true)
  })

  it('refuses restricted items to a deactivated staff account', () => {
    expect(canOpenResource({ ...staff('editor'), active: false }, restricted)).toBe(false)
  })

  it("refuses another class's item to a student", () => {
    expect(canOpenResource(student({ class: 'S2' }), restricted)).toBe(false)
    expect(canOpenResource(student(), restricted)).toBe(true)
  })

  it('refuses a restricted item to a suspended student', () => {
    expect(canOpenResource(student({ status: 'suspended' }), { visibility: 'students' })).toBe(false)
  })
})

describe('canFileInDepartment', () => {
  it('lets a head of department file under their own department only', () => {
    expect(canFileInDepartment(staff('hod', 3), 3)).toBe(true)
    expect(canFileInDepartment(staff('hod', 3), { id: 3 })).toBe(true)
    expect(canFileInDepartment(staff('hod', 3), 4)).toBe(false)
  })

  it('refuses a head of department with no department, or no department given', () => {
    expect(canFileInDepartment(staff('hod'), 3)).toBe(false)
    expect(canFileInDepartment(staff('hod', 3), undefined)).toBe(false)
  })

  it('lets editors and registrars file anywhere, and nobody else at all', () => {
    expect(canFileInDepartment(staff('editor'), 4)).toBe(true)
    expect(canFileInDepartment(staff('registrar'), 4)).toBe(true)
    expect(canFileInDepartment(staff('teacher', 3), 3)).toBe(false)
    expect(canFileInDepartment(student(), 3)).toBe(false)
    expect(canFileInDepartment(null, 3)).toBe(false)
  })
})

describe('titleFromFilename', () => {
  it('turns a file name into a readable title', () => {
    expect(titleFromFilename('S4_Physics_Paper1_2024.pdf')).toBe('S4 Physics Paper1 2024')
    expect(titleFromFilename('chemistry-notes-term-2.docx')).toBe('Chemistry notes term 2')
  })

  it('gives nothing for an empty name, so the resource must be titled by hand', () => {
    expect(titleFromFilename('')).toBe('')
    expect(titleFromFilename('.pdf')).toBe('')
  })
})
