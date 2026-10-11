/**
 * Choose a password from an invitation or a "forgot your password" email (FR-05, A07).
 *
 * The token travels in the form, not in a log or an audit entry, and is checked by Payload
 * when the form is sent. The page is never cached and never indexed.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Card } from '../../../../../components/ui'
import { ActionForm, inputClass, labelClass } from '../../../../../components/staff/ActionForm'
import { PasswordInput } from '../../../../../components/portal/PasswordInput'
import { MIN_PASSWORD_LENGTH } from '../../../../../lib/student-password'
import { resetPasswordAction } from '../../actions'

export const metadata: Metadata = {
  title: 'Choose your password',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function StaffResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  return (
    <Container className="max-w-md">
      <h1 className="text-center text-3xl">Choose your password</h1>
      <p className="mt-2 text-center text-[var(--text-muted)]">
        At least {MIN_PASSWORD_LENGTH} characters, with a letter and a number.
      </p>

      <Card className="mt-8 p-6 sm:p-8">
        <ActionForm action={resetPasswordAction} submitLabel="Save my password" pendingLabel="Saving">
          <input type="hidden" name="token" value={token} />

          <div>
            <label htmlFor="password" className={labelClass}>
              New password
            </label>
            <PasswordInput id="password" name="password" required autoComplete="new-password" className={inputClass} />
          </div>

          <div>
            <label htmlFor="confirm" className={labelClass}>
              The same password again
            </label>
            <PasswordInput id="confirm" name="confirm" required autoComplete="new-password" className={inputClass} />
          </div>
        </ActionForm>

        <p className="mt-6 border-t border-cream-200 pt-5 text-center text-sm">
          <Link href="/staff/forgot" className="font-semibold text-maroon-700 hover:underline">
            Link expired? Ask for a new one
          </Link>
        </p>
      </Card>
    </Container>
  )
}
