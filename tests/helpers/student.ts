/**
 * Signs a seeded student in through the real portal form.
 *
 * Only ever call this with the right password: five wrong attempts lock a student out for
 * fifteen minutes (FR-11), which would break every later test that signs them in.
 */

import type { Page } from '@playwright/test'

export const STUDENT_PASSWORD = 'AllianceDev1!'

export const STUDENTS = {
  /** Senior Four, cleared for a released term. */
  cleared: 'AHSN/25/001',
  /** Senior Four, fees on hold. */
  blocked: 'AHSN/25/002',
  /** Senior Six, cleared. */
  senior: 'AHSN/25/003',
} as const

export async function signInStudent(page: Page, admissionNo: string) {
  await page.goto('/portal/sign-in')
  await page.locator('#admissionNo').waitFor({ state: 'visible' })
  await page.locator('#admissionNo').fill(admissionNo)
  await page.locator('#password').fill(STUDENT_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/portal$/)
}
