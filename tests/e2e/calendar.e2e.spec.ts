/**
 * Adding an event to a phone calendar (FR-20). A published event downloads as a calendar
 * file; a draft or an unknown event gives nothing away.
 */

import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

test.setTimeout(180_000)

test.describe('Event calendar file', () => {
  test('a published event downloads as a calendar entry', async ({ page }) => {
    await page.goto('/events')
    await page.locator('a[href^="/events/"]').first().click()
    await page.waitForURL(/\/events\/[^/]+$/)
    const title = (await page.locator('h1').textContent())!.trim()

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 120_000 }),
      page.getByRole('link', { name: 'Add to calendar' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.ics$/)
    const ics = await (await download.createReadStream()).toArray().then((chunks) => Buffer.concat(chunks).toString('utf8'))

    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toMatch(/\r\nDTSTART:\d{8}T\d{6}Z\r\n/)
    // The title may be escaped or folded; compare it unfolded and unescaped.
    const unfolded = ics.replace(/\r\n /g, '').replace(/\\([,;\\])/g, '$1')
    expect(unfolded).toContain(`SUMMARY:${title}`)
  })

  test('a draft event and an unknown one both get a plain 404', async ({ request }) => {
    const payload = await getPayload({ config })
    const draft = await payload.create({
      collection: 'events',
      draft: true,
      overrideAccess: true,
      data: {
        title: 'Unannounced draft event',
        slug: `draft-event-${Date.now()}`,
        summary: 'Not yet public.',
        startDate: '2027-05-01T08:00:00.000Z',
        _status: 'draft',
      },
    })
    try {
      const response = await request.get(`/api/calendar/event/${draft.slug}`, { timeout: 120_000 })
      expect(response.status()).toBe(404)
      expect(await response.text()).not.toContain('Unannounced')
      expect((await request.get('/api/calendar/event/no-such-event')).status()).toBe(404)
    } finally {
      await payload.delete({ collection: 'events', id: draft.id, overrideAccess: true })
    }
  })
})
