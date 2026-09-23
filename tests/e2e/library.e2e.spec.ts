/**
 * The e-Library download gate, proved end to end (FR-06, FR-08, FR-09).
 *
 * AGENTS.md rule 3: the unit tests cover every branch of `canOpenResource`; these prove the
 * running server applies it, on the listings and on the file route alike.
 *
 * They rely on the seeded library: a public reading list, Senior Four physics and
 * chemistry restricted to their classes, and Senior Six mathematics restricted to S6.
 */

import { test, expect, type APIRequestContext } from '@playwright/test'
import { STUDENTS, signInStudent } from '../helpers/student'

const DOWNLOAD_LINK = 'a[href^="/api/files/resource/"]'
const S4_PHYSICS = 'Senior Four Physics past paper, 2024'
const S6_MATHS = 'Senior Six Mathematics: past paper with solutions'
const READING_LIST = 'School reading list, all classes'

// MinIO runs in Docker; under a full parallel run its first reply can pass the 30 s default.
const FILE_TIMEOUT = 120_000

// The portal and the file route are compiled on first request in dev.
test.setTimeout(180_000)

/** The card for a resource, found by its title. */
function cardFor(page: import('@playwright/test').Page, title: string) {
  return page.locator('li').filter({ has: page.getByRole('heading', { name: title }) })
}

/** Follows the route's redirect to the signed URL and proves it serves the file. */
async function expectSignedFile(request: APIRequestContext, href: string) {
  const response = await request.get(href, { maxRedirects: 0 })
  expect(response.status()).toBe(307)

  const location = response.headers()['location'] ?? ''
  expect(location).toContain('X-Amz-Signature')
  expect(Number(new URL(location).searchParams.get('X-Amz-Expires'))).toBeLessThanOrEqual(300)

  const file = await request.get(location, { timeout: FILE_TIMEOUT })
  expect(file.status()).toBe(200)
}

test.describe('e-Library', () => {
  test('a visitor sees only public items, and can download them', async ({ page }) => {
    await page.goto('/resources')

    await expect(page.getByRole('heading', { name: READING_LIST })).toBeVisible()
    await expect(page.getByRole('heading', { name: S4_PHYSICS })).toHaveCount(0)

    const href = await cardFor(page, READING_LIST).locator(DOWNLOAD_LINK).getAttribute('href')
    expect(href).toBeTruthy()
    await expectSignedFile(page.request, href!)
  })

  test("a student's library lists their class and not another's", async ({ page }) => {
    await signInStudent(page, STUDENTS.cleared)
    await page.goto('/portal/library')

    await expect(page.getByRole('heading', { name: S4_PHYSICS })).toBeVisible()
    await expect(page.getByRole('heading', { name: READING_LIST })).toBeVisible()
    await expect(page.getByRole('heading', { name: S6_MATHS })).toHaveCount(0)

    // The size is shown before the student spends data on it (FR-09).
    await expect(cardFor(page, S4_PHYSICS).getByText(/\d+(\.\d)? (KB|MB)/).first()).toBeVisible()

    const href = await cardFor(page, S4_PHYSICS).locator(DOWNLOAD_LINK).getAttribute('href')
    await expectSignedFile(page.request, href!)
  })

  test("a student cannot fetch another class's file by id", async ({ browser }) => {
    // Find the S4 file's id as a student who is allowed to see it.
    const s4Context = await browser.newContext()
    const s4Page = await s4Context.newPage()
    await signInStudent(s4Page, STUDENTS.cleared)
    await s4Page.goto('/portal/library')
    const href = await cardFor(s4Page, S4_PHYSICS).locator(DOWNLOAD_LINK).getAttribute('href')
    await s4Context.close()

    expect(href).toBeTruthy()

    // Ask for it as a Senior Six student.
    const s6Context = await browser.newContext()
    const s6Page = await s6Context.newPage()
    await signInStudent(s6Page, STUDENTS.senior)

    const response = await s6Page.request.get(href!, { maxRedirects: 0 })
    expect(response.status()).toBe(404)

    const body = await response.text()
    expect(body).not.toContain('X-Amz')
    expect(body).not.toContain('.pdf')

    await s6Context.close()
  })

  test('a visitor asking for a restricted file is sent to sign in, with no file', async ({
    browser,
    page,
  }) => {
    await signInStudent(page, STUDENTS.cleared)
    await page.goto('/portal/library')
    const href = await cardFor(page, S4_PHYSICS).locator(DOWNLOAD_LINK).getAttribute('href')

    const anonContext = await browser.newContext()
    const response = await anonContext.request.get(href!, { maxRedirects: 0 })
    const location = response.headers()['location'] ?? ''
    expect(location).not.toContain('X-Amz-Signature')
    expect(location).toContain('/portal/sign-in')
    await anonContext.close()
  })

  test('signed-out visitors are sent to sign in from the portal library', async ({ page }) => {
    await page.goto('/portal/library')
    await expect(page).toHaveURL(/\/portal\/sign-in/)
  })
})
