/**
 * Online applications, end to end (FR-16, FR-18).
 *
 * Proves a family can apply and gets a reference, that the application reaches the
 * admissions office and nobody else (AGENTS.md rule 3), and that the server checks the
 * form itself rather than trusting the browser.
 *
 * Submissions are rate-limited to five a minute per client, so this file sends only two.
 */

import { test, expect, type Page } from '@playwright/test'
import { STUDENTS, signInStudent } from '../helpers/student'

const STAFF_PASSWORD = 'AllianceDev1!'
const DATE_OF_BIRTH = `${new Date().getFullYear() - 12}-05-20`

test.setTimeout(180_000)

async function fillSeniorOne(page: Page) {
  await page.getByLabel('Senior One (joining from primary school)').check()
  await page.getByLabel('First name').fill('Test')
  await page.getByLabel('Surname').fill('Applicant')
  await page.getByLabel('Female').check()
  await page.getByLabel('Date of birth').fill(DATE_OF_BIRTH)
  await page.getByLabel('Current or last school').fill('Example Primary School')
  await page.getByLabel('Boarding', { exact: true }).check()
  await page.getByLabel('PLE index number').fill('001234/056')
  await page.getByLabel('Mathematics').selectOption('D1')
  await page.getByLabel('English').selectOption('D2')
  await page.getByLabel('Science').selectOption('C3')
  await page.getByLabel('Social Studies (S.S.T)').selectOption('D2')
  await page.getByLabel('Full name').fill('Test Guardian')
  await page.getByLabel('Telephone').fill('0700 000000')
  await page.getByLabel(/I confirm these details are true/).check()
}

test.describe('Online application', () => {
  test('a family applies for Senior One and only the admissions office can read it', async ({
    page,
    browser,
  }) => {
    await page.goto('/admissions/apply')
    await fillSeniorOne(page)
    await expect(page.getByText('Total aggregate: 8')).toBeVisible()
    await page.getByRole('button', { name: 'Send the application' }).click()

    // The first submission compiles the action on a cold `next dev`, so wait longer than usual.
    const code = page.getByTestId('tracking-code')
    await expect(code).toHaveText(/^AHSN-[A-HJ-NP-Z2-9]{6}$/, { timeout: 120_000 })
    const trackingCode = (await code.textContent())!.trim()
    const query = `/api/applications?depth=0&where[trackingCode][equals]=${trackingCode}`

    // The admissions officer finds it, with the aggregate worked out on the server.
    const staff = await browser.newContext()
    const login = await staff.request.post('/api/users/login', {
      data: { email: 'admissions@alliancehigh.sc.ug', password: STAFF_PASSWORD },
    })
    expect(login.ok()).toBe(true)
    const found = await (await staff.request.get(query)).json()
    expect(found.docs).toHaveLength(1)
    expect(found.docs[0]).toMatchObject({ status: 'submitted', classSought: 'S1', pleAggregate: 8 })
    await staff.close()

    // Nobody else can read it: not the public, not a signed-in student.
    const anonymous = await browser.newContext()
    const anonymousRead = await anonymous.request.get(query)
    expect(anonymousRead.status()).toBe(403)
    await anonymous.close()

    const student = await browser.newContext()
    const studentPage = await student.newPage()
    await signInStudent(studentPage, STUDENTS.senior)
    const studentRead = await studentPage.request.get(query)
    expect(studentRead.status()).toBe(403)
    await student.close()
  })

  test('the public cannot create an application through the API', async ({ request }) => {
    const response = await request.post('/api/applications', {
      data: { trackingCode: 'AHSN-FAKE00', applicantName: 'Bypass', status: 'admitted' },
    })
    expect(response.status()).toBe(403)
  })

  test('the browser points out missing answers before anything is sent', async ({ page }) => {
    await page.goto('/admissions/apply')
    await page.getByLabel('Senior One (joining from primary school)').check()
    await page.getByRole('button', { name: 'Send the application' }).click()

    await expect(page.locator('form [role="alert"]')).toContainText(/need attention/)
    await expect(page.getByText('Enter a name').first()).toBeVisible()
    await expect(page.getByLabel('First name')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('tracking-code')).toHaveCount(0)
  })

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('the server refuses an incomplete form and keeps what was typed', async ({ page }) => {
      await page.goto('/admissions/apply')
      await page.getByLabel('Senior One (joining from primary school)').check()
      await page.getByLabel('First name').fill('Test')
      // No surname, no grades, no consent. A full-page post: on a cold `next dev` the
      // server renders it slowly the first time, so allow more than the 30 s default.
      await page.getByRole('button', { name: 'Send the application' }).click({ timeout: 120_000 })

      await expect(page.locator('form [role="alert"]')).toContainText(/need attention/)
      await expect(page.getByText('Please confirm the details are correct')).toBeVisible()
      await expect(page.getByLabel('First name')).toHaveValue('Test')
      await expect(page.getByTestId('tracking-code')).toHaveCount(0)
    })
  })
})
