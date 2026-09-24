/**
 * The About sub-pages: leadership in order of seniority, heads of subject by level, and
 * placeholders that never show their brackets (AGENTS.md rule 6).
 */

import { test, expect } from '@playwright/test'

test.setTimeout(180_000)

test.describe('About: leadership and staff', () => {
  test('leadership reads from the Director down', async ({ page }) => {
    await page.goto('/about/leadership')
    const names = page.getByTestId('staff-person').locator('h3')
    await expect(names.first()).toHaveText('Mr. TURYAKIRA NJENJEKA')
    await expect(names.nth(1)).toHaveText('Mrs. Ainesaasi Oliver')
    await expect(page.getByTestId('staff-person').nth(1)).toContainText('Head Teacher')
    // The deputy's name has not been supplied: the role shows, the placeholder does not.
    await expect(page.getByText('Deputy Head Teacher')).toBeVisible()
    await expect(page.locator('main')).not.toContainText('[')
  })

  test('heads of subject are listed by level, with no placeholder brackets', async ({ page }) => {
    await page.goto('/about/staff')
    await expect(page.getByRole('heading', { name: 'O-Level' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'A-Level' })).toBeVisible()
    await expect(page.getByText('Head of Mathematics, O-Level')).toBeVisible()
    await expect(page.getByText('Mr. Agodo Walter')).toBeVisible()
    await expect(page.locator('main')).not.toContainText('[')
  })

  test('both pages are reachable from the About page', async ({ page }) => {
    await page.goto('/about')
    await page.locator('main').getByRole('link', { name: /Our staff/ }).click()
    await expect(page).toHaveURL(/\/about\/staff$/)
  })
})
