import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test'

/** The seed's development password for every staff account. */
export const STAFF_PASSWORD = 'AllianceDev1!'

/** Generous, because `next dev` compiles each route on its first request. */
const READY_TIMEOUT = 180_000

/** Signs a staff member in through the staff portal form, the only door for anyone but the super admin. */
export async function signInAtStaffPortal(page: Page, email: string, password = STAFF_PASSWORD): Promise<void> {
  await page.goto('/staff/sign-in', { timeout: READY_TIMEOUT })
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/staff$/, { timeout: READY_TIMEOUT })
}

/**
 * A browser context signed in as this staff member. Its `request` carries the session
 * cookie, so API calls run as them. Close the context when done.
 */
export async function staffContext(browser: Browser, baseURL: string | undefined, email: string): Promise<BrowserContext> {
  // Left out when unknown, so the context keeps the base URL from the Playwright config.
  const context = await browser.newContext(baseURL ? { baseURL } : {})
  const page = await context.newPage()
  await signInAtStaffPortal(page, email)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hello')
  await page.close()
  return context
}
