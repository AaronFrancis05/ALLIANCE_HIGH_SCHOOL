/**
 * Staff invitations, role-scoped admin and first-time student sign-in (FR-05, FR-10).
 *
 * AGENTS.md rule 3: each feature behind a login proves who is turned away. Here: nobody can
 * set a password for someone else, only the super admin adds staff, a student cannot edit
 * their own record, a first-time code goes only to the addresses on file, and asking for a
 * code never reveals whether an admission number exists.
 */

import { test, expect, type APIRequestContext, type Page, type PlaywrightWorkerArgs } from '@playwright/test'
import { login } from '../helpers/login'
import { mailFor } from '../helpers/mailpit'
import { createUnsetStudent, deleteStaffByEmail, deleteStudent } from '../helpers/accounts'
import { STUDENTS } from '../helpers/student'

const STAFF_PASSWORD = 'AllianceDev1!'
const SUPER_ADMIN = 'admin@alliancehigh.sc.ug'
const EDITOR = 'editor@alliancehigh.sc.ug'
const REGISTRAR = 'registrar@alliancehigh.sc.ug'

test.setTimeout(180_000)
test.describe.configure({ mode: 'serial' })

async function signInStaff(request: APIRequestContext, email: string) {
  const response = await request.post('/api/users/login', { data: { email, password: STAFF_PASSWORD }, timeout: 120_000 })
  expect(response.ok()).toBe(true)
}

async function asStaff(playwright: PlaywrightWorkerArgs['playwright'], baseURL: string | undefined, email: string) {
  const context = await playwright.request.newContext({ baseURL })
  await signInStaff(context, email)
  return context
}

const SENT_NOTICE = /a 6-digit code is on its way/i

async function requestCode(page: Page, admissionNo: string) {
  await page.goto('/portal/first-time')
  await page.locator('#admissionNo').fill(admissionNo)
  await page.getByRole('button', { name: 'Email me a code' }).click()
  await expect(page.locator('p[role="status"]')).toContainText(SENT_NOTICE)
}

function codeIn(text: string): string {
  const match = text.match(/\b(\d{6})\b/)
  expect(match).not.toBeNull()
  return match![1]
}

test.describe('Staff invitations', () => {
  const invitee = `invitee-${Date.now()}@example.test`

  test.afterAll(async () => {
    await deleteStaffByEmail(invitee)
  })

  test('the super admin adds staff without a password, and the invitee sets their own', async ({
    playwright,
    baseURL,
    page,
  }) => {
    const admin = await asStaff(playwright, baseURL, SUPER_ADMIN)
    // A password typed for someone else is ignored.
    const created = await admin.post('/api/users', {
      data: { name: 'Invited Teacher', email: invitee, role: 'teacher', password: 'Typed12345' },
      timeout: 120_000,
    })
    expect(created.status()).toBe(201)

    const typed = await page.request.post('/api/users/login', { data: { email: invitee, password: 'Typed12345' } })
    expect(typed.ok()).toBe(false)

    // The invitation arrives with a link to choose a password.
    await expect.poll(async () => (await mailFor(page.request, invitee)).length).toBeGreaterThan(0)
    const [invitation] = await mailFor(page.request, invitee)
    expect(invitation.subject).toContain('invited')
    const link = invitation.text.match(/https?:\/\/\S+\/admin\/reset\/\S+/)?.[0]
    expect(link).toBeTruthy()

    await page.goto(new URL(link!).pathname, { timeout: 180_000 })
    await page.getByLabel('New Password').fill('Chosen12345!')
    await page.getByLabel('Confirm Password').fill('Chosen12345!')
    await page.getByRole('button', { name: 'Reset Password' }).click()
    await page.waitForURL(/\/admin$/, { timeout: 180_000 })

    const chosen = await page.request.post('/api/users/login', { data: { email: invitee, password: 'Chosen12345!' } })
    expect(chosen.ok()).toBe(true)
    await admin.dispose()
  })

  test('the admin form adds a staff member with no password box, and sends the invitation', async ({ page }) => {
    const viaForm = `form-invitee-${Date.now()}@example.test`
    try {
      await login({ page, user: { email: SUPER_ADMIN, password: STAFF_PASSWORD } })
      await page.goto('/admin/collections/users/create')
      await page.locator('#field-email').fill(viaForm)
      await expect(page.getByLabel('New Password')).toBeHidden()
      await page.locator('#field-name').fill('Form Invitee')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(page.getByText('Invitation pending')).toBeVisible()
      await expect.poll(async () => (await mailFor(page.request, viaForm)).length).toBe(1)
    } finally {
      await deleteStaffByEmail(viaForm)
    }
  })

  test('nobody but the super admin can add staff or send invitations', async ({ playwright, baseURL }) => {
    const editor = await asStaff(playwright, baseURL, EDITOR)
    const create = await editor.post('/api/users', {
      data: { name: 'Sneaky', email: `sneaky-${Date.now()}@example.test`, role: 'superAdmin' },
    })
    expect(create.status()).toBe(403)

    const me = (await (await editor.get('/api/users/me')).json()) as { user: { id: number } }
    const invite = await editor.post(`/api/users/${me.user.id}/invite`)
    expect(invite.status()).toBe(403)
    await editor.dispose()
  })

  test('the super admin cannot set another person’s password', async ({ playwright, baseURL, page }) => {
    const admin = await asStaff(playwright, baseURL, SUPER_ADMIN)
    const { docs } = (await (await admin.get(`/api/users?where[email][equals]=${encodeURIComponent(EDITOR)}`)).json()) as {
      docs: { id: number }[]
    }
    await admin.patch(`/api/users/${docs[0].id}`, { data: { password: 'Hijacked123' } })
    const hijack = await page.request.post('/api/users/login', { data: { email: EDITOR, password: 'Hijacked123' } })
    expect(hijack.ok()).toBe(false)
    await admin.dispose()
  })
})

test.describe('Admin shows each role only its own work', () => {
  test('the content editor sees content, not students or staff accounts', async ({ page }) => {
    await login({ page, user: { email: EDITOR, password: STAFF_PASSWORD } })
    const nav = page.locator('nav')
    await expect(nav.getByRole('link', { name: 'News' }).first()).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Students' })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Staff accounts' })).toHaveCount(0)
    await expect(page.locator('.ahsn-welcome')).toContainText('Content Editor')

    // Hidden is not just hidden: the section cannot be opened by URL either.
    const response = await page.goto('/admin/collections/students')
    expect(response?.status()).toBe(404)
  })

  test('the registrar sees students, not news or staff accounts', async ({ page }) => {
    await login({ page, user: { email: REGISTRAR, password: STAFF_PASSWORD } })
    const nav = page.locator('nav')
    await expect(nav.getByRole('link', { name: 'Students' }).first()).toBeVisible()
    await expect(nav.getByRole('link', { name: 'News' })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Staff accounts' })).toHaveCount(0)
  })
})

test.describe('First-time student sign-in', () => {
  const stamp = Date.now()
  const admissionNo = `TEST/${stamp}`
  const studentEmail = `pupil-${stamp}@example.test`
  const guardianEmail = `guardian-${stamp}@example.test`
  let studentId: number

  test.beforeAll(async () => {
    studentId = await createUnsetStudent({ admissionNo, email: studentEmail, guardianEmail })
  })

  test.afterAll(async () => {
    await deleteStudent(studentId)
  })

  test('the registrar adds a student in the admin without typing a password', async ({ page }) => {
    const viaForm = `FORM/${stamp}`
    await login({ page, user: { email: REGISTRAR, password: STAFF_PASSWORD } })
    await page.goto('/admin/collections/students/create')
    await page.locator('#field-admissionNo').fill(viaForm)
    await expect(page.getByLabel('New Password')).toBeHidden()
    await page.locator('#field-firstName').fill('Form')
    await page.locator('#field-lastName').fill('Student')
    await page.locator('#field-class').click()
    await page.getByRole('option', { name: 'Senior One' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL(/\/admin\/collections\/students\/\d+/)

    const id = Number(page.url().match(/students\/(\d+)/)![1])
    await deleteStudent(id)
  })

  test('the sign-in page offers first-time sign-in', async ({ page }) => {
    await page.goto('/portal/sign-in')
    await page.getByRole('link', { name: 'First-time sign-in' }).click()
    await expect(page).toHaveURL(/\/portal\/first-time$/)
  })

  test('a record with no password of its own cannot be signed into', async ({ page }) => {
    await page.goto('/portal/sign-in')
    await page.locator('#admissionNo').fill(admissionNo)
    await page.locator('#password').fill('Guess12345')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('p[role="alert"]')).toContainText('first-time sign-in')
  })

  test('the code goes to the student and the guardian, and sets up the account', async ({ page }) => {
    await requestCode(page, admissionNo)

    await expect.poll(async () => (await mailFor(page.request, studentEmail)).length).toBe(1)
    await expect.poll(async () => (await mailFor(page.request, guardianEmail)).length).toBe(1)
    const [mail] = await mailFor(page.request, studentEmail)
    expect(mail.text).not.toContain(admissionNo)
    const code = codeIn(mail.subject)

    // A wrong code is refused.
    const wrong = code === '000000' ? '111111' : '000000'
    await page.locator('#code').fill(wrong)
    await page.locator('#password').fill('Nansana2026')
    await page.locator('#confirm').fill('Nansana2026')
    await page.getByRole('button', { name: 'Set password and sign in' }).click()
    await expect(page.locator('p[role="alert"]')).toContainText('not right')

    await page.locator('#code').fill(code)
    await page.locator('#password').fill('Nansana2026')
    await page.locator('#confirm').fill('Nansana2026')
    await page.getByRole('button', { name: 'Set password and sign in' }).click()
    await page.waitForURL(/\/portal$/)
  })

  test('once set up, the student signs in normally and no new code is sent', async ({ page, browser }) => {
    const fresh = await browser.newContext()
    const freshPage = await fresh.newPage()
    await freshPage.goto('/portal/sign-in')
    await freshPage.locator('#admissionNo').fill(admissionNo)
    await freshPage.locator('#password').fill('Nansana2026')
    await freshPage.locator('button[type="submit"]').click()
    await freshPage.waitForURL(/\/portal$/)
    await fresh.close()

    // Asking again gets the same answer but sends nothing: the account is already set up.
    await requestCode(page, admissionNo)
    await page.waitForTimeout(3_000)
    expect(await mailFor(page.request, studentEmail)).toHaveLength(1)
  })

  test('an unknown admission number gets exactly the same answer', async ({ page }) => {
    await requestCode(page, `NOPE/${stamp}`)
  })

  test('a student cannot change their own record through the API', async ({ playwright, baseURL }) => {
    const student = await playwright.request.newContext({ baseURL })
    const signIn = await student.post('/api/students/login', {
      data: { username: STUDENTS.senior, password: STAFF_PASSWORD },
    })
    expect(signIn.ok()).toBe(true)
    const { user } = (await signIn.json()) as { user: { id: number } }

    const edit = await student.patch(`/api/students/${user.id}`, { data: { admissionNo: 'HIJACK/1' } })
    expect(edit.status()).toBe(403)
    await student.dispose()
  })
})
