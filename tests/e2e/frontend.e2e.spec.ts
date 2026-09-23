/**
 * Public site smoke tests (P1-T7).
 *
 * These prove the home page renders the seeded CMS content, that it behaves on a 360 px
 * phone, and that the portal is never exposed to search engines.
 */

import { test, expect } from '@playwright/test'

const PHONE = { width: 360, height: 780 }

test.describe('Public site', () => {
  test('home page shows the school name and main landmarks', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Alliance High School Nansana/i)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('describes the school for search engines', async ({ page }) => {
    await page.goto('/')

    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(50)

    // The knowledge-panel structured data (FR-24).
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(jsonLd).toContain('Alliance High School Nansana')
  })

  test('has no horizontal scroll on a 360 px phone', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/')

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    expect(overflows).toBe(false)
  })

  test('the phone drawer opens, closes and is reachable by keyboard', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/')

    const toggle = page.getByRole('button', { name: /menu/i }).first()
    await expect(toggle).toBeVisible()

    // Touch targets must be at least 44 px (AGENTS.md section 2.3).
    const box = await toggle.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)

    // Scoped to the drawer itself: the footer also links to Admissions and stays visible,
    // so an unscoped locator would never report the drawer as closed.
    const drawer = page.locator('#mobile-menu')

    await toggle.click()
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Admissions' }).first()).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
  })

  test('the student portal is never indexed', async ({ page }) => {
    const response = await page.goto('/portal')

    // The portal may redirect to a sign-in page, but whatever renders must be noindex.
    if (response && response.status() < 400) {
      const robots = await page.locator('meta[name="robots"]').getAttribute('content')
      expect(robots).toContain('noindex')
    }
  })
})
