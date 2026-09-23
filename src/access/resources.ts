/**
 * Who may see and edit e-Library resources (FR-06, FR-07, FR-08).
 *
 * Reading:  public items are open to everyone; anything else needs a signed-in student
 *           whose class is listed on the resource.
 * Writing:  editors and registrars anywhere; a head of department only inside their
 *           own department; nobody else.
 */

import type { Access, Where } from 'payload'
import { departmentId, hasRole, isStaff, isStudent, type StaffUser, type StudentUser } from './roles'

export type SchoolClass = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6'

export const SCHOOL_CLASSES: SchoolClass[] = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

export const CLASS_LABELS: Record<SchoolClass, string> = {
  S1: 'Senior One',
  S2: 'Senior Two',
  S3: 'Senior Three',
  S4: 'Senior Four',
  S5: 'Senior Five',
  S6: 'Senior Six',
}

interface StudentWithClass extends StudentUser {
  class?: SchoolClass
}

/**
 * The query a visitor is allowed to see. Returning a `Where` rather than `true` keeps the
 * filtering in the database, so a restricted resource can never be listed by accident.
 */
export function visibleResourcesWhere(user: unknown): Where {
  const publicOnly: Where = { visibility: { equals: 'public' } }

  if (isStaff(user as StaffUser)) return {} // staff see everything

  if (isStudent(user as StudentUser)) {
    const student = user as StudentWithClass
    if (student.status !== 'active') return publicOnly

    const studentVisible: Where = {
      or: [
        { visibility: { equals: 'public' } },
        { visibility: { equals: 'students' } },
        {
          and: [
            { visibility: { equals: 'classes' } },
            ...(student.class ? [{ classes: { contains: student.class } }] : [{ id: { exists: false } }]),
          ],
        },
      ],
    }
    return studentVisible
  }

  return publicOnly
}

export const readResources: Access = ({ req }) => visibleResourcesWhere(req.user)

/** Editors and registrars may manage any resource; a HOD only their own department's. */
export const writeResources: Access = ({ req }) => {
  const user = req.user as StaffUser | null

  if (hasRole(user, 'superAdmin', 'editor', 'registrar')) return true

  if (hasRole(user, 'hod')) {
    const department = departmentId(user)
    if (!department) return false
    return { department: { equals: department } }
  }

  return false
}

/**
 * True when this student may open this resource. Used by the download route before a
 * signed URL is issued, so the check never depends on what the browser sent.
 */
export function canStudentOpenResource(
  student: StudentWithClass | null,
  resource: { visibility: 'public' | 'students' | 'classes'; classes?: SchoolClass[] | null },
): boolean {
  if (resource.visibility === 'public') return true
  if (!student || student.status !== 'active') return false
  if (resource.visibility === 'students') return true
  if (resource.visibility === 'classes') {
    if (!student.class) return false
    return Boolean(resource.classes?.includes(student.class))
  }
  return false
}

/**
 * True when whoever is asking may have this resource's file: anyone for a public item,
 * active staff for everything, otherwise the student rule above. The download route calls
 * this after loading the resource, so the decision is made twice by two different paths.
 */
export function canOpenResource(
  user: unknown,
  resource: { visibility: 'public' | 'students' | 'classes'; classes?: SchoolClass[] | null },
): boolean {
  if (resource.visibility === 'public') return true
  if (isStaff(user as StaffUser)) return true
  if (isStudent(user as StudentUser)) return canStudentOpenResource(user as StudentWithClass, resource)
  return false
}
