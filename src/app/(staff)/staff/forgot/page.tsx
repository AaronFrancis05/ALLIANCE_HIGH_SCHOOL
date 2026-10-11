/**
 * Asks for a link to choose a new staff password (FR-05, A07). The reply is the same
 * whether or not the address has an account.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Card } from '../../../../components/ui'
import { ActionForm, inputClass, labelClass } from '../../../../components/staff/ActionForm'
import { forgotPasswordAction } from '../actions'

export const metadata: Metadata = {
  title: 'Forgot your password',
  robots: { index: false, follow: false },
}

export default function StaffForgotPage() {
  return (
    <Container className="max-w-md">
      <h1 className="text-center text-3xl">Forgot your password?</h1>
      <p className="mt-2 text-center text-[var(--text-muted)]">
        We will email you a link to choose a new one.
      </p>

      <Card className="mt-8 p-6 sm:p-8">
        <ActionForm action={forgotPasswordAction} submitLabel="Send the link" pendingLabel="Sending">
          <div>
            <label htmlFor="email" className={labelClass}>
              Work email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              spellCheck={false}
              className={inputClass}
            />
          </div>
        </ActionForm>

        <p className="mt-6 border-t border-cream-200 pt-5 text-center text-sm">
          <Link href="/staff/sign-in" className="font-semibold text-maroon-700 hover:underline">
            Back to sign-in
          </Link>
        </p>
      </Card>
    </Container>
  )
}
