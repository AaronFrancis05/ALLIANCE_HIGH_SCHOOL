/**
 * Proves the three-part report card gate (FR-13, FR-14, FR-15).
 *
 * A report card is released only when the term is released AND the student is cleared
 * AND the requester owns it. Each of those is tested on its own, because a bug in any
 * one of them would expose a child's results.
 */

import { describe, expect, it } from 'vitest'
import {
  evaluateReportCardAccess,
  readClearances,
  readReportCards,
  writeClearances,
  writeReportCards,
  type GateInput,
} from '../../src/access/report-cards'
import type { StudentUser } from '../../src/access/roles'
import { staffUser as staff, type StaffAs } from '../helpers/staff'

const OWNER = 42

function gate(overrides: Partial<GateInput> = {}) {
  const input: GateInput = {
    requester: { id: OWNER, collection: 'students' },
    ownerId: OWNER,
    termReleased: true,
    clearance: { status: 'cleared' },
    published: true,
    ...overrides,
  }
  return evaluateReportCardAccess(input)
}

/** The gate's view of a staff requester: their account type and roles. */
const asStaff = (as: StaffAs) => {
  const { accountType, roles } = staff(as)
  return { requester: { id: 7, collection: 'users' as const }, requesterAccount: { accountType, roles } }
}
const student = (id: string | number = OWNER): StudentUser => ({ id, collection: 'students', status: 'active' })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (user: unknown): any => ({ req: { user } })

describe('evaluateReportCardAccess', () => {
  it('allows the owner when the term is released and they are cleared', () => {
    expect(gate()).toEqual({ allowed: true })
  })

  it('refuses a visitor who is not signed in', () => {
    const result = gate({ requester: null })
    expect(result.allowed).toBe(false)
    expect(result).toMatchObject({ reason: 'not-signed-in' })
  })

  it('refuses another student, even when everything else is in order', () => {
    const result = gate({ requester: { id: 999, collection: 'students' } })
    expect(result.allowed).toBe(false)
    expect(result).toMatchObject({ reason: 'not-owner' })
  })

  it('does not reveal whether the other report card exists', () => {
    const otherStudent = gate({ requester: { id: 999, collection: 'students' } })
    const otherStaff = gate(asStaff('teacher'))
    // Identical wording, so ids cannot be probed by comparing messages.
    expect(otherStudent).toMatchObject({ allowed: false })
    expect(otherStaff).toMatchObject({ allowed: false })
    expect((otherStudent as { message: string }).message).toBe((otherStaff as { message: string }).message)
  })

  it('refuses the owner while the term is unreleased', () => {
    const result = gate({ termReleased: false })
    expect(result).toMatchObject({ allowed: false, reason: 'not-released' })
  })

  it('refuses the owner while the individual card is unpublished', () => {
    const result = gate({ published: false })
    expect(result).toMatchObject({ allowed: false, reason: 'not-released' })
  })

  it('refuses the owner when the bursar has blocked them', () => {
    const result = gate({ clearance: { status: 'blocked', reason: 'Balance of UGX 250,000' } })
    expect(result).toMatchObject({ allowed: false, reason: 'not-cleared' })
    expect((result as { message: string }).message).toContain('Balance of UGX 250,000')
  })

  it('refuses the owner when no clearance has been recorded at all', () => {
    const result = gate({ clearance: null })
    expect(result).toMatchObject({ allowed: false, reason: 'not-cleared' })
  })

  it('reports being unreleased before being uncleared, so fees are not discussed needlessly', () => {
    const result = gate({ termReleased: false, clearance: { status: 'blocked' } })
    expect(result).toMatchObject({ reason: 'not-released' })
  })

  it('lets the secretary fetch any card for support', () => {
    expect(gate(asStaff('secretary'))).toEqual({ allowed: true })
  })

  it('lets the super admin fetch any card', () => {
    expect(gate(asStaff('superAdmin'))).toEqual({ allowed: true })
  })

  it('refuses the bursar, who has no business reading results', () => {
    const result = gate(asStaff('bursar'))
    expect(result).toMatchObject({ allowed: false, reason: 'not-owner' })
  })

  it('still refuses the bursar now that the bursar also runs admissions', () => {
    expect(gate(asStaff(['bursar', 'teacher']))).toMatchObject({ allowed: false, reason: 'not-owner' })
  })

  it('refuses staff with no role', () => {
    expect(gate(asStaff(null))).toMatchObject({ allowed: false, reason: 'not-owner' })
  })

  it('refuses a teacher', () => {
    const result = gate(asStaff('teacher'))
    expect(result).toMatchObject({ allowed: false, reason: 'not-owner' })
  })
})

describe('readReportCards', () => {
  it('gives the secretary the whole collection', () => {
    expect(readReportCards(req(staff('secretary')))).toBe(true)
  })

  it('refuses the bursar and the teacher', () => {
    expect(readReportCards(req(staff('bursar')))).toBe(false)
    expect(readReportCards(req(staff('teacher')))).toBe(false)
    expect(readReportCards(req(staff(['bursar', 'editor'])))).toBe(false)
  })

  it('limits a student to their own rows', () => {
    expect(readReportCards(req(student(5)))).toEqual({ student: { equals: 5 } })
  })

  it('refuses an anonymous visitor', () => {
    expect(readReportCards(req(null))).toBe(false)
  })
})

describe('writeReportCards', () => {
  it('is the secretary only', () => {
    expect(writeReportCards(req(staff('secretary')))).toBe(true)
    expect(writeReportCards(req(staff('superAdmin')))).toBe(true)
    expect(writeReportCards(req(staff('bursar')))).toBe(false)
    expect(writeReportCards(req(student()))).toBe(false)
    expect(writeReportCards(req(null))).toBe(false)
  })
})

describe('clearances', () => {
  it('are written by the bursar only', () => {
    expect(writeClearances(req(staff('bursar')))).toBe(true)
    expect(writeClearances(req(staff('secretary')))).toBe(false)
    expect(writeClearances(req(student()))).toBe(false)
  })

  it('are readable by a student for their own record, so the portal can explain a block', () => {
    expect(readClearances(req(student(5)))).toEqual({ student: { equals: 5 } })
    expect(readClearances(req(staff('bursar')))).toBe(true)
    expect(readClearances(req(staff('secretary')))).toBe(true)
    expect(readClearances(req(staff('editor')))).toBe(false)
    expect(readClearances(req(null))).toBe(false)
  })
})
