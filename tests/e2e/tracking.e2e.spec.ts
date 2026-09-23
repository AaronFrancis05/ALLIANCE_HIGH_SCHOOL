/**
 * Tracking an application (FR-18): the family sees progress with the reference and their
 * phone number, and nobody learns anything from a wrong guess.
 */

import { test, expect } from '@playwright/test'
import { createTestApplication, deleteTestApplication, TEST_GUARDIAN_PHONE } from '../helpers/application'

const NOT_FOUND = /could not find an application with that reference and telephone number/

test.setTimeout(180_000)
test.describe.configure({ mode: 'serial' })

let application: { id: number; trackingCode: string }

test.describe('Application tracking', () => {
  test.beforeAll(async () => {
    application = await createTestApplication({ status: 'interview', interviewDate: '2027-01-15T09:00:00.000Z' })
  })

  test.afterAll(async () => {
    await deleteTestApplication(application.id)
  })

  test('a family sees the stage and interview date, and no name', async ({ page }) => {
    await page.goto('/admissions/track')
    // Typed in lower case, with the number written the international way.
    await page.getByLabel('Application reference').fill(application.trackingCode.toLowerCase())
    await page.getByLabel('Parent or guardian telephone').fill('+256 772 123 456')
    await page.getByRole('button', { name: 'Check progress' }).click()

    const result = page.getByTestId('tracking-result')
    await expect(result).toContainText('Interview or entrance test', { timeout: 120_000 })
    await expect(result).toContainText('15 January 2027')
    await expect(result).toContainText(application.trackingCode)
    await expect(page.locator('body')).not.toContainText('Testcase')
    // The lookup is a POST: neither the reference nor the number is in the address.
    expect(page.url()).not.toContain(application.trackingCode)
  })

  test('a wrong phone number and an unknown reference get the same answer', async ({ page }) => {
    await page.goto('/admissions/track')
    await page.getByLabel('Application reference').fill(application.trackingCode)
    await page.getByLabel('Parent or guardian telephone').fill('0772 999999')
    await page.getByRole('button', { name: 'Check progress' }).click()
    const wrongPhone = page.locator('form [role="alert"]')
    await expect(wrongPhone).toContainText(NOT_FOUND, { timeout: 120_000 })
    const wrongPhoneText = await wrongPhone.textContent()

    await page.getByLabel('Application reference').fill('AHSN-ZZZZZZ')
    await page.getByLabel('Parent or guardian telephone').fill(TEST_GUARDIAN_PHONE)
    await page.getByRole('button', { name: 'Check progress' }).click()
    await expect(page.locator('form [role="alert"]')).toHaveText(wrongPhoneText!)
    await expect(page.getByTestId('tracking-result')).toHaveCount(0)
  })
})
