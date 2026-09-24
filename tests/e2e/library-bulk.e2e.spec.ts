/**
 * Bulk upload for heads of department (P3-T2, FR-06, FR-07).
 *
 * The admin panel's bulk upload creates one resource per file through the same API as a
 * single upload, so the department rule is proved on that API first: a head of department
 * cannot file under, or move a resource into, another department. Then the real bulk
 * upload drawer is driven end to end.
 */

import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { PDFDocument } from 'pdf-lib'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const HOD = 'hod.sciences@alliancehigh.sc.ug'
const PASSWORD = 'AllianceDev1!'
const TAG = `bulk${Date.now()}`

test.setTimeout(240_000)
test.describe.configure({ mode: 'serial' })

async function pdf(): Promise<Buffer> {
  const document = await PDFDocument.create()
  document.addPage([300, 400]).drawText('Test resource', { x: 40, y: 340, size: 14 })
  return Buffer.from(await document.save())
}

async function signIn(request: APIRequestContext) {
  const response = await request.post('/api/users/login', { data: { email: HOD, password: PASSWORD } })
  expect(response.ok()).toBe(true)
  const { user } = await response.json()
  return { ownDepartment: typeof user.department === 'object' ? user.department.id : user.department }
}

async function upload(request: APIRequestContext, fields: Record<string, unknown>, filename: string) {
  return request.post('/api/resources', {
    multipart: {
      _payload: JSON.stringify(fields),
      file: { name: filename, mimeType: 'application/pdf', buffer: await pdf() },
    },
    timeout: 120_000,
  })
}

async function removeTestResources() {
  const payload = await getPayload({ config })
  await payload.delete({
    collection: 'resources',
    where: { or: [{ title: { contains: TAG } }, { description: { equals: TAG } }] },
    overrideAccess: true,
  })
}

test.describe('Bulk upload for heads of department', () => {
  let ids: { own: number; other: number; subject: number }

  test.beforeAll(async ({ playwright, baseURL }) => {
    const request = await playwright.request.newContext({ baseURL })
    const { ownDepartment } = await signIn(request)
    const departments = await (await request.get('/api/departments?limit=50&depth=0')).json()
    const other = departments.docs.find((department: { id: number }) => department.id !== ownDepartment)
    const subjects = await (await request.get('/api/subjects?limit=1&depth=0')).json()
    ids = { own: ownDepartment, other: other.id, subject: subjects.docs[0].id }
    await request.dispose()
  })

  test.afterAll(removeTestResources)

  test('a head of department cannot file under another department, or move a resource there', async ({
    playwright,
    baseURL,
  }) => {
    const request = await playwright.request.newContext({ baseURL })
    await signIn(request)
    const common = { type: 'notes', subject: ids.subject, classes: ['S3'], visibility: 'students', description: TAG }

    const elsewhere = await upload(request, { ...common, title: `${TAG} elsewhere`, department: ids.other }, 'a.pdf')
    expect(elsewhere.status()).toBe(403)

    const own = await upload(request, { ...common, department: ids.own }, `${TAG}_own_department.pdf`)
    expect(own.status()).toBe(201)
    const created = (await own.json()).doc
    // No title was given, so it comes from the file name.
    expect(created.title).toBe(`${TAG} own department`.replace(/^./, (c) => c.toUpperCase()))

    const moved = await request.patch(`/api/resources/${created.id}`, { data: { department: ids.other } })
    expect(moved.status()).toBe(403)
    const after = await (await request.get(`/api/resources/${created.id}?depth=0`)).json()
    expect(after.department).toBe(ids.own)
    await request.dispose()
  })

  test('the bulk upload drawer files several papers at once, titled from their names', async ({ page }) => {
    await signInToAdmin(page)
    await page.goto('/admin/collections/resources', { timeout: 180_000 })
    await page.getByRole('button', { name: 'Bulk Upload' }).click()
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles([
        { name: `${TAG}_S3_Biology_Notes.pdf`, mimeType: 'application/pdf', buffer: await pdf() },
        { name: `${TAG}_S3_Biology_Paper_2023.pdf`, mimeType: 'application/pdf', buffer: await pdf() },
      ])

    // Subject and classes are set on each file; the department is already the head's own.
    for (let file = 0; file < 2; file += 1) {
      await chooseOption(page, 'Subject', 0)
      await chooseOption(page, 'Classes', 2)
      await page.getByLabel('Description').fill(TAG)
      if (file === 0) await page.getByRole('button', { name: 'Next', exact: true }).click()
    }
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    const payload = await getPayload({ config })
    await expect
      .poll(
        async () => {
          const found = await payload.find({
            collection: 'resources',
            where: { title: { contains: TAG }, description: { equals: TAG } },
            overrideAccess: true,
            depth: 0,
          })
          return found.docs
            .filter((doc) => doc.title?.includes('Biology'))
            .map((doc) => `${doc.title}|${doc.department}`)
            .sort()
        },
        { timeout: 120_000 },
      )
      .toEqual([`${capitalise(TAG)} S3 Biology Notes|${ids.own}`, `${capitalise(TAG)} S3 Biology Paper 2023|${ids.own}`])
  })
})

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

async function signInToAdmin(page: Page) {
  await page.goto('/admin/login', { timeout: 180_000 })
  await page.locator('#field-email').fill(HOD)
  await page.locator('#field-password').fill(PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin$/, { timeout: 180_000 })
}

/** Picks an option in one of Payload's select fields by its position in the list. */
async function chooseOption(page: Page, label: string, index: number) {
  const field = page.locator('.field-type').filter({ has: page.locator('label', { hasText: new RegExp(`^${label}`) }) }).first()
  await field.locator('.rs__control').click()
  await page.locator('.rs__option').nth(index).click()
  // Close the list by clicking away; Escape would close the whole bulk upload drawer.
  await page.getByRole('heading', { name: 'Resource', exact: true }).click()
}
