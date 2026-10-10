/**
 * Throwaway staff and student accounts for the invitation and first-time sign-in tests,
 * made through Payload's local API. Always remove them afterwards.
 */

import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

/** A student record as the registrar would create it: no password, emails on file. */
export async function createUnsetStudent(input: {
  admissionNo: string
  email?: string
  guardianEmail?: string
}): Promise<number> {
  const payload = await getPayload({ config })
  const student = await payload.create({
    collection: 'students',
    overrideAccess: true,
    data: {
      admissionNo: input.admissionNo,
      // The collection sets this from the admission number; the generated type still wants it.
      username: input.admissionNo,
      firstName: 'Firsttime',
      lastName: 'Testcase',
      class: 'S2',
      status: 'active',
      email: input.email,
      guardians: [{ name: 'Test Guardian', phone: '0772000000', email: input.guardianEmail }],
    },
  })
  return student.id
}

export async function deleteStudent(id: number): Promise<void> {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'students', id, overrideAccess: true }).catch(() => undefined)
}

export async function deleteStaffByEmail(email: string): Promise<void> {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'users', where: { email: { equals: email } }, overrideAccess: true })
}
