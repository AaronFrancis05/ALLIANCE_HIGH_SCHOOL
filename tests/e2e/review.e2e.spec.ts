/**
 * The bursar's admissions review workflow (FR-19): stages follow the allowed steps, other
 * staff cannot change them, and the family is emailed at every step. Mail is read back from
 * Mailpit, which catches everything the app sends locally.
 */

import { test, expect, type APIRequestContext } from '@playwright/test'
import { createTestApplication, deleteTestApplication } from '../helpers/application'
import { staffContext } from '../helpers/staff-portal'

const MAILPIT = process.env.MAILPIT_URL ?? 'http://localhost:8025'

test.setTimeout(180_000)
test.describe.configure({ mode: 'serial' })

let application: { id: number; trackingCode: string }
const guardianEmail = `review-${Date.now()}@example.test`

/** Subjects of the mail Mailpit holds for one address, oldest first. */
async function mailFor(request: APIRequestContext, address: string): Promise<{ subject: string; text: string }[]> {
  const search = await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`)
  const { messages } = (await search.json()) as { messages: { ID: string; Subject: string }[] }
  const mail = []
  for (const message of messages.reverse()) {
    const full = (await (await request.get(`${MAILPIT}/api/v1/message/${message.ID}`)).json()) as { Text: string }
    mail.push({ subject: message.Subject, text: full.Text })
  }
  return mail
}

test.describe('Admissions review', () => {
  test.beforeAll(async () => {
    application = await createTestApplication({ guardianEmail })
  })

  test.afterAll(async () => {
    await deleteTestApplication(application.id)
  })

  test('the family is emailed the reference when the application arrives', async ({ request }) => {
    await expect
      .poll(async () => (await mailFor(request, guardianEmail)).map((mail) => mail.subject))
      .toContain(`Application received: ${application.trackingCode}`)
  })

  test('the bursar moves it on step by step, and each step reaches the family', async ({ browser, playwright, baseURL }) => {
    const bursar = await staffContext(browser, baseURL, 'bursar@alliancehigh.sc.ug')
    const officer = bursar.request
    const url = `/api/applications/${application.id}`

    // A decision cannot be made before the application has been reviewed.
    const skipped = await officer.patch(url, { data: { status: 'admitted' }, timeout: 120_000 })
    expect(skipped.status()).toBe(400)
    expect(await skipped.text()).toContain('cannot move from')

    expect((await officer.patch(url, { data: { status: 'review' } })).status()).toBe(200)
    expect((await officer.patch(url, { data: { status: 'admitted' } })).status()).toBe(200)

    // A decision is final for the officer.
    expect((await officer.patch(url, { data: { status: 'rejected' } })).status()).toBe(400)

    const saved = await (await officer.get(`${url}?depth=0`)).json()
    expect(saved.status).toBe('admitted')
    expect(saved.history.map((entry: { status: string }) => entry.status)).toEqual(['submitted', 'review', 'admitted'])
    expect(saved.statusChangedAt).toBeTruthy()
    await bursar.close()

    const request = await playwright.request.newContext()
    await expect
      .poll(async () => (await mailFor(request, guardianEmail)).map((mail) => mail.subject))
      .toEqual([
        `Application received: ${application.trackingCode}`,
        `Application ${application.trackingCode}: Under review`,
        `Application ${application.trackingCode}: Offered a place`,
      ])
    // Mail names the application by reference only, never the child.
    for (const mail of await mailFor(request, guardianEmail)) expect(mail.text).not.toContain('Testcase')
    await request.dispose()
  })

  test('other staff cannot read or move an application', async ({ browser, baseURL }) => {
    for (const email of ['editor@alliancehigh.sc.ug', 'secretary@alliancehigh.sc.ug']) {
      const context = await staffContext(browser, baseURL, email)
      const url = `/api/applications/${application.id}`
      expect((await context.request.get(url)).status(), email).toBe(403)
      expect((await context.request.patch(url, { data: { status: 'rejected' } })).status(), email).toBe(403)
      await context.close()
    }
  })
})
