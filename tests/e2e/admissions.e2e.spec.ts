/**
 * Online applications, end to end (FR-16, FR-17, FR-18).
 *
 * Proves a family can apply and gets a reference, that the application reaches the
 * admissions office and nobody else (AGENTS.md rule 3), and that the server checks the
 * form itself rather than trusting the browser.
 *
 * Submissions are rate-limited to five a minute per client, so this file sends only three.
 */

import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import { test, expect, type Page } from '@playwright/test'
import { STUDENTS, signInStudent } from '../helpers/student'

const STAFF_PASSWORD = 'AllianceDev1!'
const DATE_OF_BIRTH = `${new Date().getFullYear() - 12}-05-20`

test.setTimeout(180_000)

/** A genuine one-page PDF: Payload checks a PDF's structure on upload. */
async function pdfDocument(): Promise<Buffer> {
  const document = await PDFDocument.create()
  document.addPage([300, 400]).drawText('Test document', { x: 40, y: 340, size: 14 })
  return Buffer.from(await document.save())
}

/** A phone photo that still carries EXIF, as a real one would. */
function photoWithExif() {
  return sharp({ create: { width: 300, height: 400, channels: 3, background: '#c8b89a' } })
    .jpeg()
    .withExif({ IFD0: { Make: 'PhoneMaker', ImageDescription: 'Taken at 0.4000N 32.5000E' } })
    .toBuffer()
}

async function attachDocuments(page: Page, photo: { name: string; mimeType: string; buffer: Buffer }) {
  const buffer = await pdfDocument()
  const pdf = (name: string) => ({ name, mimeType: 'application/pdf', buffer })
  await page.getByLabel('Birth certificate').setInputFiles(pdf('birth-certificate.pdf'))
  await page.getByLabel('Result slip').setInputFiles(pdf('ple-slip.pdf'))
  await page.getByLabel('Passport photograph').setInputFiles(photo)
}

async function fillSeniorOne(page: Page) {
  await page.getByLabel('Senior One (joining from primary school)').check()
  await page.getByLabel('First name').fill('Test')
  await page.getByLabel('Surname').fill('Applicant')
  await page.getByLabel('Female').check()
  await page.getByLabel('Date of birth').fill(DATE_OF_BIRTH)
  await page.getByLabel('Current or last school').fill('Example Primary School')
  await page.getByLabel('Boarding', { exact: true }).check()
  await page.getByLabel('PLE index number').fill('001234/056')
  await page.getByLabel('Mathematics').selectOption('D1')
  await page.getByLabel('English').selectOption('D2')
  await page.getByLabel('Science').selectOption('C3')
  await page.getByLabel('Social Studies (S.S.T)').selectOption('D2')
  await page.getByLabel('Full name').fill('Test Guardian')
  await page.getByLabel('Telephone').fill('0700 000000')
  await page.getByLabel(/I confirm these details are true/).check()
}

test.describe('Online application', () => {
  test('a family applies for Senior One and only the admissions office can read it', async ({
    page,
    browser,
  }) => {
    await page.goto('/admissions/apply')
    await fillSeniorOne(page)
    await attachDocuments(page, { name: 'IMG_2041.jpg', mimeType: 'image/jpeg', buffer: await photoWithExif() })
    await expect(page.getByText('Total aggregate: 8')).toBeVisible()
    await page.getByRole('button', { name: 'Send the application' }).click()

    // The first submission compiles the action on a cold `next dev`, so wait longer than usual.
    const code = page.getByTestId('tracking-code')
    await expect(code).toHaveText(/^AHSN-[A-HJ-NP-Z2-9]{6}$/, { timeout: 120_000 })
    const trackingCode = (await code.textContent())!.trim()
    const query = `/api/applications?depth=0&where[trackingCode][equals]=${trackingCode}`

    // The admissions officer finds it, with the aggregate worked out on the server.
    const staff = await browser.newContext()
    const login = await staff.request.post('/api/users/login', {
      data: { email: 'admissions@alliancehigh.sc.ug', password: STAFF_PASSWORD },
    })
    expect(login.ok()).toBe(true)
    const found = await (await staff.request.get(query.replace('depth=0', 'depth=1'))).json()
    expect(found.docs).toHaveLength(1)
    expect(found.docs[0]).toMatchObject({ status: 'submitted', classSought: 'S1', pleAggregate: 8 })

    // The three documents are attached, stored under random names, and the photo has lost its EXIF.
    const documents: { kind: string; file: { id: number; filename: string } }[] = found.docs[0].documents
    expect(documents.map((document) => document.kind).sort()).toEqual(['birth', 'photo', 'results'])
    for (const document of documents) expect(document.file.filename).toMatch(/^[0-9a-f-]{36}\.(pdf|jpg)$/)

    // The officer opens the photo through the delivery route: a five-minute signed link.
    const photoRoute = `/api/files/application-document/${documents.find((d) => d.kind === 'photo')!.file.id}`
    // The route is compiled on its first request under `next dev`.
    const redirect = await staff.request.get(photoRoute, { maxRedirects: 0, timeout: 120_000 })
    expect(redirect.status()).toBe(307)
    const signed = redirect.headers()['location'] ?? ''
    expect(Number(new URL(signed).searchParams.get('X-Amz-Expires'))).toBeLessThanOrEqual(300)
    const photo = await staff.request.get(signed, { timeout: 120_000 })
    expect(photo.status()).toBe(200)
    expect((await sharp(await photo.body()).metadata()).exif).toBeUndefined()
    await staff.close()

    // Nobody else can read the application or open its files: not the public, not a student.
    const anonymous = await browser.newContext()
    expect((await anonymous.request.get(query)).status()).toBe(403)
    const anonymousFile = await anonymous.request.get(photoRoute, { maxRedirects: 0 })
    expect(anonymousFile.status()).toBe(404)
    expect(anonymousFile.headers()['location'] ?? '').not.toContain('X-Amz')
    await anonymous.close()

    const student = await browser.newContext()
    const studentPage = await student.newPage()
    await signInStudent(studentPage, STUDENTS.senior)
    expect((await studentPage.request.get(query)).status()).toBe(403)
    expect((await studentPage.request.get(photoRoute, { maxRedirects: 0 })).status()).toBe(404)
    await student.close()
  })

  test('a file that only pretends to be a photo is turned away', async ({ page }) => {
    await page.goto('/admissions/apply')
    await fillSeniorOne(page)
    await attachDocuments(page, {
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('<html><script>alert(1)</script></html>'),
    })
    await page.getByRole('button', { name: 'Send the application' }).click()

    await expect(page.getByText('That file does not look like the type it claims to be.')).toBeVisible({
      timeout: 120_000,
    })
    await expect(page.locator('form [role="alert"]')).toContainText(/choose the documents again/)
    await expect(page.getByTestId('tracking-code')).toHaveCount(0)
  })

  test('the public cannot create an application or a document through the API', async ({ request }) => {
    const response = await request.post('/api/applications', {
      data: { trackingCode: 'AHSN-FAKE00', applicantName: 'Bypass', status: 'admitted' },
    })
    expect(response.status()).toBe(403)

    const upload = await request.post('/api/applicationDocuments', {
      multipart: {
        _payload: JSON.stringify({ kind: 'photo' }),
        file: { name: 'photo.pdf', mimeType: 'application/pdf', buffer: await pdfDocument() },
      },
    })
    expect(upload.status()).toBe(403)
  })

  test('the browser points out missing answers before anything is sent', async ({ page }) => {
    await page.goto('/admissions/apply')
    await page.getByLabel('Senior One (joining from primary school)').check()
    await page.getByRole('button', { name: 'Send the application' }).click()

    await expect(page.locator('form [role="alert"]')).toContainText(/need attention/)
    await expect(page.getByText('Enter a name').first()).toBeVisible()
    await expect(page.getByLabel('First name')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('tracking-code')).toHaveCount(0)
  })

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('the server refuses an incomplete form and keeps what was typed', async ({ page }) => {
      await page.goto('/admissions/apply')
      await page.getByLabel('Senior One (joining from primary school)').check()
      await page.getByLabel('First name').fill('Test')
      // No surname, no grades, no consent. A full-page post: on a cold `next dev` the
      // server renders it slowly the first time, so allow more than the 30 s default.
      await page.getByRole('button', { name: 'Send the application' }).click({ timeout: 120_000 })

      await expect(page.locator('form [role="alert"]')).toContainText(/need attention/)
      await expect(page.getByText('Please confirm the details are correct')).toBeVisible()
      await expect(page.getByLabel('First name')).toHaveValue('Test')
      await expect(page.getByTestId('tracking-code')).toHaveCount(0)
    })
  })
})
