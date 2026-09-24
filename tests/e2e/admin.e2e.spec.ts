/**
 * Admin panel smoke tests: a staff account can sign in and reach the dashboard, a list
 * view and an edit view. The access rules themselves are proved in the unit tests.
 */

import { test, expect } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe.configure({ mode: 'serial' })

// The Payload admin bundle is compiled on first request in dev, which can take well over
// the default 30 s on a cold machine. The tests themselves are quick once it is warm.
test.setTimeout(180_000)

test.describe('Admin panel', () => {
  test.beforeAll(async () => {
    await seedTestUser()
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test.beforeEach(async ({ page }) => {
    await login({ page, user: testUser })
  })

  test('can reach the dashboard', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('span[title="Dashboard"]').first()).toBeVisible()
  })

  test('can open a list view', async ({ page }) => {
    await page.goto('/admin/collections/users')
    await expect(page.locator('h1', { hasText: 'Staff accounts' }).first()).toBeVisible()
  })

  test('can open an edit view', async ({ page }) => {
    await page.goto('/admin/collections/users/create')
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })
})
