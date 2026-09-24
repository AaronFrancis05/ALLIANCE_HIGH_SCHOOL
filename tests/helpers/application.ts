/**
 * Creates an application directly through Payload's local API, so tests about tracking and
 * review do not spend the public form's rate limit. Always remove it afterwards.
 */

import { getPayload } from 'payload'
import config from '../../src/payload.config.js'
import { generateTrackingCode } from '../../src/lib/admissions-schema'
import type { Application } from '../../src/payload-types'

export const TEST_GUARDIAN_PHONE = '0772 123456'

export async function createTestApplication(
  overrides: Partial<Pick<Application, 'status' | 'interviewDate' | 'guardianEmail'>> = {},
): Promise<{ id: number; trackingCode: string }> {
  const payload = await getPayload({ config })
  const trackingCode = generateTrackingCode()
  const application = await payload.create({
    collection: 'applications',
    overrideAccess: true,
    data: {
      trackingCode,
      status: 'submitted',
      applicantType: 's1',
      applicantName: 'Tracking Testcase',
      dateOfBirth: `${new Date().getFullYear() - 12}-02-10`,
      gender: 'male',
      classSought: 'S1',
      residence: 'day',
      previousSchool: 'Example Primary School',
      guardianName: 'Test Guardian',
      guardianPhone: TEST_GUARDIAN_PHONE,
      consent: true,
      ...overrides,
    },
  })
  return { id: application.id, trackingCode }
}

export async function deleteTestApplication(id: number): Promise<void> {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'applications', id, overrideAccess: true })
}
