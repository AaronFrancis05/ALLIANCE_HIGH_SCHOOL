/**
 * The contact page enquiry form (FR-21): a message is saved for the office and emailed to
 * it, the public cannot read or forge enquiries, and the server checks the form itself.
 *
 * Enquiries are rate-limited to five per ten minutes per client, so this file sends two.
 */

import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const MAILPIT = process.env.MAILPIT_URL ?? 'http://localhost:8025'
const SUBJECT = `Visit ${Date.now()}`

test.setTimeout(180_000)

test.afterAll(async () => {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'formSubmissions', where: { subject: { equals: SUBJECT } }, overrideAccess: true })
})

test.describe('Enquiry form', () => {
  test('a visit request reaches the office inbox and the admin panel', async ({ page, playwright, baseURL }) => {
    await page.goto('/contact')
    await page.getByLabel('Arrange a visit to the school').check()
    await page.getByLabel('Your name').fill('Test Parent')
    await page.getByLabel('Telephone').fill('0772 123456')
    await page.getByLabel('Subject').fill(SUBJECT)
    await page.getByLabel('Message').fill('We would like to see the dormitories on a Saturday morning.')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByTestId('enquiry-sent')).toBeVisible({ timeout: 120_000 })

    // The editor sees it in the admin panel's data.
    const editor = await playwright.request.newContext({ baseURL })
    await editor.post('/api/users/login', { data: { email: 'editor@alliancehigh.sc.ug', password: 'AllianceDev1!' } })
    const saved = await (
      await editor.get(`/api/formSubmissions?where[subject][equals]=${encodeURIComponent(SUBJECT)}&depth=0`)
    ).json()
    expect(saved.docs).toHaveLength(1)
    expect(saved.docs[0]).toMatchObject({ form: 'visit', phone: '0772 123456', handled: false })
    await editor.dispose()

    // And the office has a copy by email.
    await expect
      .poll(async () => {
        const search = await page.request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`subject:"${SUBJECT}"`)}`)
        return ((await search.json()) as { messages_count: number }).messages_count
      })
      .toBe(1)
  })

  test('the public cannot read enquiries or post one straight to the API', async ({ request }) => {
    expect((await request.get('/api/formSubmissions')).status()).toBe(403)
    const forged = await request.post('/api/formSubmissions', {
      data: { form: 'contact', name: 'Bot', message: 'Posted around the form checks' },
    })
    expect(forged.status()).toBe(403)
  })

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('the server asks a former student for the year they finished', async ({ page }) => {
      await page.goto('/contact')
      await page.getByLabel('Register as a former student').check()
      await page.getByLabel('Your name').fill('Test Alumna')
      await page.getByLabel('Email').fill('alumna@example.test')
      await page.getByLabel('Message').fill('I finished Senior Six here and would like to stay in touch.')
      await page.getByRole('button', { name: 'Send message' }).click({ timeout: 120_000 })

      await expect(page.getByText('Enter the year you finished, for example 2015')).toBeVisible()
      await expect(page.getByLabel('Your name')).toHaveValue('Test Alumna')
      await expect(page.getByTestId('enquiry-sent')).toHaveCount(0)
    })
  })
})
