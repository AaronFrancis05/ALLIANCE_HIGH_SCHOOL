/**
 * Who may see and change student records (FR-10).
 *
 * The registrar keeps the records: they create them from the details the school holds,
 * including the admission number in whatever format the school uses. Students change
 * nothing about their own record through the API. Their only change is their password,
 * which they set through first-time sign-in on the portal (see student-setup.ts).
 */

import type { Access, FieldAccess } from 'payload'
import { hasRole, isStudent, type StaffRole, type StaffUser, type StudentUser } from './roles'

type AnyUser = StaffUser | StudentUser | null | undefined

/** Staff who keep student records. The super admin is always included by hasRole. */
export const STUDENT_RECORD_KEEPERS: StaffRole[] = ['registrar']

/** Staff whose work needs a student's details: clearance, admissions, teaching. */
const STUDENT_READERS: StaffRole[] = ['registrar', 'bursar', 'admissions', 'teacher', 'hod']

export function canKeepStudentRecords(user: unknown): boolean {
  return hasRole(user as AnyUser, ...STUDENT_RECORD_KEEPERS)
}

export const manageStudents: Access = ({ req }) => canKeepStudentRecords(req.user)

export const readStudents: Access = ({ req }) => {
  const user = req.user as AnyUser
  if (hasRole(user, ...STUDENT_READERS)) return true
  if (isStudent(user)) return { id: { equals: user.id } }
  return false
}

export const fieldStudentRecordKeepers: FieldAccess = ({ req }) => canKeepStudentRecords(req.user)
