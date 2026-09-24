/**
 * The report card gate (FR-13, FR-14, FR-15).
 *
 * A student may download a report card only when all three hold:
 *   1. the report card belongs to them,
 *   2. the registrar has released results for that term,
 *   3. the bursar has cleared them for that term.
 *
 * Every one of these is decided here, on the server, on every request. The storage key
 * never reaches the browser, and the outcome is written to the audit log by the caller.
 */

import type { Access } from 'payload'
import { hasRole, isStaff, isStudent, type StaffUser, type StudentUser } from './roles'

export type ClearanceStatus = 'cleared' | 'blocked'

export interface GateInput {
  /** Who is asking. */
  requester: { id: string | number; collection: 'students' | 'users' } | null
  /** Who the report card belongs to. */
  ownerId: string | number
  /** Whether the registrar has released this term's results. */
  termReleased: boolean
  /** The bursar's decision for this student and term, if one has been recorded. */
  clearance: { status: ClearanceStatus; reason?: string | null } | null
  /** Whether the registrar has published this particular report card. */
  published: boolean
  /** Staff role of the requester, when the requester is staff. */
  requesterRole?: StaffUser['role']
}

export type GateResult =
  | { allowed: true }
  | { allowed: false; reason: 'not-signed-in' | 'not-owner' | 'not-released' | 'not-cleared'; message: string }

const BURSAR_CONTACT = 'the Bursar’s office'

/**
 * Decides whether a download may proceed. Pure, so it is easy to test every branch.
 */
export function evaluateReportCardAccess(input: GateInput): GateResult {
  const { requester, ownerId, termReleased, clearance, published } = input

  if (!requester) {
    return { allowed: false, reason: 'not-signed-in', message: 'Please sign in to view your report card.' }
  }

  // Staff who are allowed to handle results may always fetch, for support and checking.
  if (requester.collection === 'users') {
    if (hasRole({ ...requester, collection: 'users', role: input.requesterRole } as StaffUser, 'registrar')) {
      return { allowed: true }
    }
    return { allowed: false, reason: 'not-owner', message: 'You do not have access to this report card.' }
  }

  if (String(requester.id) !== String(ownerId)) {
    // Deliberately the same wording as a missing record, so ids cannot be probed.
    return { allowed: false, reason: 'not-owner', message: 'You do not have access to this report card.' }
  }

  if (!termReleased || !published) {
    return {
      allowed: false,
      reason: 'not-released',
      message: 'Results for this term have not been released yet. Please check back after the school announces them.',
    }
  }

  if (!clearance || clearance.status !== 'cleared') {
    const reason = clearance?.reason?.trim()
    return {
      allowed: false,
      reason: 'not-cleared',
      message: reason
        ? `Your report card is on hold: ${reason}. Please speak to ${BURSAR_CONTACT}.`
        : `Your report card is on hold until your fees are cleared. Please speak to ${BURSAR_CONTACT}.`,
    }
  }

  return { allowed: true }
}

// ---------------------------------------------------------------- collection access

/** Students may list only their own report cards; the rest is decided at download time. */
export const readReportCards: Access = ({ req }) => {
  const user = req.user

  if (isStaff(user as StaffUser)) {
    if (hasRole(user as StaffUser, 'registrar')) return true
    // Other staff, including the bursar, have no business reading result files (FR-14).
    return false
  }

  if (isStudent(user as StudentUser)) {
    return { student: { equals: user!.id } }
  }

  return false
}

/** Only the registrar uploads, edits or releases report cards. */
export const writeReportCards: Access = ({ req }) => hasRole(req.user as StaffUser, 'registrar')

/** Only the bursar (and super admin) records fee clearance. */
export const writeClearances: Access = ({ req }) => hasRole(req.user as StaffUser, 'bursar')

/** A student may see their own clearance status so the portal can explain a block. */
export const readClearances: Access = ({ req }) => {
  const user = req.user
  if (hasRole(user as StaffUser, 'bursar', 'registrar', 'admissions')) return true
  if (isStudent(user as StudentUser)) return { student: { equals: user!.id } }
  return false
}
