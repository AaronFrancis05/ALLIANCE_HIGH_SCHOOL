/**
 * A staff member's own profile (FR-05): their name and their password. Their roles,
 * department and subjects are shown but set only by the super admin.
 */

import React from 'react'
import type { Metadata } from 'next'
import { Container, Card } from '../../../../components/ui'
import { ActionForm, inputClass, labelClass } from '../../../../components/staff/ActionForm'
import { PasswordInput } from '../../../../components/portal/PasswordInput'
import { requirePortalStaff } from '../../../../lib/session'
import { MIN_PASSWORD_LENGTH } from '../../../../lib/student-password'
import { ROLE_LABELS, rolesOf } from '../../../../access/roles'
import { changePasswordAction, updateNameAction } from '../actions'

export const metadata: Metadata = { title: 'Your profile' }

export default async function StaffProfilePage() {
  const staff = await requirePortalStaff()
  const roles = rolesOf({ ...staff, collection: 'users' })

  return (
    <Container className="max-w-xl">
      <h1 className="text-3xl">Your profile</h1>

      <Card className="mt-8 p-6 sm:p-8">
        <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
          <dt className="text-[var(--text-muted)]">Email</dt>
          <dd className="break-all text-[var(--text-strong)]">{staff.email}</dd>
          <dt className="text-[var(--text-muted)]">Roles</dt>
          <dd className="text-[var(--text-strong)]">
            {roles.length ? roles.map((role) => ROLE_LABELS[role]).join(', ') : 'Staff (no role yet)'}
          </dd>
        </dl>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Your email address and roles are set by the ICT office.
        </p>
      </Card>

      <section aria-labelledby="name-heading" className="mt-8">
        <h2 id="name-heading" className="text-xl">
          Your name
        </h2>
        <Card className="mt-4 p-6 sm:p-8">
          <ActionForm action={updateNameAction} submitLabel="Save my name" pendingLabel="Saving">
            <div>
              <label htmlFor="name" className={labelClass}>
                Full name, as it should appear in the staff directory
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                defaultValue={staff.name}
                className={inputClass}
              />
            </div>
          </ActionForm>
        </Card>
      </section>

      <section aria-labelledby="password-heading" className="mt-8">
        <h2 id="password-heading" className="text-xl">
          Change your password
        </h2>
        <Card className="mt-4 p-6 sm:p-8">
          <ActionForm action={changePasswordAction} submitLabel="Change my password" pendingLabel="Changing">
            <div>
              <label htmlFor="current" className={labelClass}>
                Current password
              </label>
              <PasswordInput id="current" name="current" required autoComplete="current-password" className={inputClass} />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>
                New password (at least {MIN_PASSWORD_LENGTH} characters, with a letter and a number)
              </label>
              <PasswordInput id="password" name="password" required autoComplete="new-password" className={inputClass} />
            </div>
            <div>
              <label htmlFor="confirm" className={labelClass}>
                The new password again
              </label>
              <PasswordInput id="confirm" name="confirm" required autoComplete="new-password" className={inputClass} />
            </div>
          </ActionForm>
        </Card>
      </section>
    </Container>
  )
}
