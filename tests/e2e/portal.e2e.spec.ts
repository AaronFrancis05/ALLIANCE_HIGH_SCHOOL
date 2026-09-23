/**
 * The report card gate, proved end to end (FR-13, FR-14, FR-15, FR-08).
 *
 * AGENTS.md rule 3: any feature behind a login ships with tests that prove a user cannot
 * reach what they should not. The unit tests cover every branch of the decision; these
 * prove the wiring — that the decision is actually applied by the running server, to the
 * page and to the file route alike.
 *
 * They rely on the seeded students: AHSN/25/001 is cleared for a released term,
 * AHSN/25/002 is blocked.
 */

import { test, expect, type Page } from '@playwright/test'

const PASSWORD = 'AllianceDev1!'
const CLEARED = 'AHSN/25/001'
const BLOCKED = 'AHSN/25/002'

const DOWNLOAD_LINK = 'a[href^="/api/files/report-card/"]'

// The portal and the file route are compiled on first request in dev.
test.setTimeout(180_000)

async function signIn(page: Page, admissionNo: string) {
  await page.goto('/portal/sign-in')
  await page.locator('#admissionNo').waitFor({ state: 'visible' })
  await page.locator('#admissionNo').fill(admissionNo)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/portal$/)
}

test.describe('Student portal', () => {
  test('signed-out visitors are sent to sign in, not to the records', async ({ page }) => {
    await page.goto('/portal/results')
    await expect(page).toHaveURL(/\/portal\/sign-in/)
  })

  test('is never indexed', async ({ page }) => {
    await page.goto('/portal/sign-in')
    const robots = await page.locator('meta[name="robots"]').getAttribute('content')
    expect(robots).toContain('noindex')
  })

  test('an unknown admission number is refused without revealing that it is unknown', async ({
    page,
  }) => {
    await page.goto('/portal/sign-in')
    // Deliberately a number that does not exist: signing in wrongly as a real student
    // five times would lock that student out for fifteen minutes (FR-11).
    await page.locator('#admissionNo').fill('AHSN/00/000')
    await page.locator('#password').fill('definitely-not-the-password')
    await page.locator('button[type="submit"]').click()

    // Scoped to the form: Next.js renders its own route announcer with role="alert",
    // so an unscoped getByRole('alert') matches two elements.
    const alert = page.locator('form [role="alert"]')
    await expect(alert).toContainText(/do not match/i)
    await expect(alert).not.toContainText(/no such|not found|does not exist|unknown/i)
  })

  test('a cleared student can download their own report card', async ({ page }) => {
    await signIn(page, CLEARED)
    await page.goto('/portal/results')

    const link = page.locator(DOWNLOAD_LINK).first()
    await expect(link).toBeVisible()

    const href = await link.getAttribute('href')
    const response = await page.request.get(href!, { maxRedirects: 0 })

    // The file is handed over as a short-lived signed URL, never as a storage key.
    expect(response.status()).toBe(307)
    const location = response.headers()['location'] ?? ''
    expect(location).toContain('X-Amz-Signature')
    expect(Number(new URL(location).searchParams.get('X-Amz-Expires'))).toBeLessThanOrEqual(300)
  })

  test('a blocked student is told why, and offered no download', async ({ page }) => {
    await signIn(page, BLOCKED)
    await page.goto('/portal/results')

    await expect(page.getByText(/bursar/i).first()).toBeVisible()
    await expect(page.locator(DOWNLOAD_LINK)).toHaveCount(0)
  })

  test("a student cannot fetch another student's report card by id", async ({ browser }) => {
    // Find a real card id as the student who is allowed to see it.
    const clearedContext = await browser.newContext()
    const clearedPage = await clearedContext.newPage()
    await signIn(clearedPage, CLEARED)
    await clearedPage.goto('/portal/results')
    const href = await clearedPage.locator(DOWNLOAD_LINK).first().getAttribute('href')
    await clearedContext.close()

    expect(href).toBeTruthy()

    // Ask for it as somebody else.
    const otherContext = await browser.newContext()
    const otherPage = await otherContext.newPage()
    await signIn(otherPage, BLOCKED)

    const response = await otherPage.request.get(href!, { maxRedirects: 0 })
    expect([403, 404]).toContain(response.status())

    const body = await response.text()
    expect(body).not.toContain('X-Amz')
    expect(body).not.toContain('.pdf')

    await otherContext.close()
  })

  test('an anonymous request for a real card gets no file', async ({ browser, page }) => {
    await signIn(page, CLEARED)
    await page.goto('/portal/results')
    const href = await page.locator(DOWNLOAD_LINK).first().getAttribute('href')

    const anonContext = await browser.newContext()
    const response = await anonContext.request.get(href!, { maxRedirects: 0 })
    const location = response.headers()['location'] ?? ''
    expect(location).not.toContain('X-Amz-Signature')
    await anonContext.close()
  })
})
