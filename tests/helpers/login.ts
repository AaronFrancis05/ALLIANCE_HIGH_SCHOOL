import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/** Generous, because `next dev` compiles the admin bundle on the first request. */
const ADMIN_READY_TIMEOUT = 180_000

/**
 * Signs the user into the admin panel through the login form.
 */
export async function login({ page, serverURL = '', user }: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/admin/login`, { timeout: ADMIN_READY_TIMEOUT })

  // The form is client-rendered, so wait for it rather than for the document load event.
  const email = page.locator('#field-email')
  await email.waitFor({ state: 'visible', timeout: ADMIN_READY_TIMEOUT })

  await email.fill(user.email)
  await page.locator('#field-password').fill(user.password)
  await page.click('button[type="submit"]')

  await page.waitForURL(/\/admin$/, { timeout: ADMIN_READY_TIMEOUT })
  await expect(page.locator('span[title="Dashboard"]').first()).toBeVisible({ timeout: ADMIN_READY_TIMEOUT })
}
