/**
 * The careers page: open posts are listed, closed ones drop off but keep a page that says
 * so, drafts stay private, and applying starts the enquiry form on this post.
 */

import { test, expect } from '@playwright/test'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config.js'

test.setTimeout(180_000)

const stamp = Date.now()
const ids: (string | number)[] = []
let payload: Payload

function day(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * 86_400_000)
  return `${date.toISOString().slice(0, 10)}T12:00:00.000Z`
}

async function vacancy(title: string, closingDate: string | null, status: 'published' | 'draft' = 'published') {
  const doc = await payload.create({
    collection: 'vacancies',
    draft: status === 'draft',
    overrideAccess: true,
    data: {
      title,
      slug: `${title.toLowerCase().replace(/[^a-z]+/g, '-')}-${stamp}`,
      summary: `Test post: ${title}.`,
      employment: 'fullTime',
      closingDate,
      _status: status,
    },
  })
  ids.push(doc.id)
  return doc
}

test.describe('Careers', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config })
  })

  test.afterAll(async () => {
    for (const id of ids) await payload.delete({ collection: 'vacancies', id, overrideAccess: true })
  })

  test('lists open posts only, and applying presets the form', async ({ page }) => {
    const open = await vacancy(`Open post ${stamp}`, day(14))
    await vacancy(`Closed post ${stamp}`, day(-3))
    await vacancy(`Draft post ${stamp}`, day(14), 'draft')

    await page.goto('/careers')
    const listed = page.getByTestId('vacancy')
    await expect(listed.filter({ hasText: `Open post ${stamp}` })).toHaveCount(1)
    await expect(page.locator('main')).not.toContainText(`Closed post ${stamp}`)
    await expect(page.locator('main')).not.toContainText(`Draft post ${stamp}`)

    await listed.filter({ hasText: `Open post ${stamp}` }).getByRole('link').click()
    // The dev server compiles the vacancy route on first visit.
    await page.waitForURL(new RegExp(`/careers/${open.slug}$`), { timeout: 120_000 })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Open post ${stamp}`)
    await expect(page.locator('#enquiry-topic-careers')).toBeChecked()
    await expect(page.locator('#enquiry-position')).toHaveValue(`Open post ${stamp}`)
  })

  test('a closed post says so and offers no form; a draft is a 404', async ({ page }) => {
    const closed = await vacancy(`Finished post ${stamp}`, day(-1))
    const draft = await vacancy(`Hidden post ${stamp}`, null, 'draft')

    await page.goto(`/careers/${closed.slug}`)
    await expect(page.getByTestId('vacancy-closed')).toBeVisible()
    await expect(page.locator('#enquiry-position')).toHaveCount(0)

    const response = await page.goto(`/careers/${draft.slug}`)
    expect(response?.status()).toBe(404)
  })
})
