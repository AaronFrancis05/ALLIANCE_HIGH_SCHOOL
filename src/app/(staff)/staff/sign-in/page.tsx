/**
 * Staff sign-in (FR-05, FR-11). Every staff member except the super admin signs in here.
 */

import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, HelpCircle } from 'lucide-react'
import { Container, Card } from '../../../../components/ui'
import { ActionForm, inputClass, labelClass } from '../../../../components/staff/ActionForm'
import { PasswordInput } from '../../../../components/portal/PasswordInput'
import { currentStaff } from '../../../../lib/session'
import { signInAction } from '../actions'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default async function StaffSignInPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  // Already signed in: no reason to show the form again.
  if (await currentStaff()) redirect('/staff')
  const passwordSet = (await searchParams).password === 'set'

  return (
    <Container className="max-w-md">
      <h1 className="text-center text-3xl">Staff sign-in</h1>
      <p className="mt-2 text-center text-[var(--text-muted)]">Use your work email address.</p>

      {passwordSet ? (
        <p
          role="status"
          className="mt-6 flex gap-2 rounded-[var(--radius-card)] border border-green-200 bg-green-50 p-3 text-sm text-green-900"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Your password is set. Sign in with it below.
        </p>
      ) : null}

      <Card className="mt-8 p-6 sm:p-8">
        <ActionForm action={signInAction} submitLabel="Sign in" pendingLabel="Signing in">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email address
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

          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <PasswordInput id="password" name="password" required autoComplete="current-password" className={inputClass} />
          </div>
        </ActionForm>

        <p className="mt-6 border-t border-cream-200 pt-5 text-center text-sm">
          <Link href="/staff/forgot" className="font-semibold text-maroon-700 hover:underline">
            Forgot your password?
          </Link>
        </p>
      </Card>

      <p className="mt-5 flex items-start justify-center gap-2 text-center text-sm text-[var(--text-muted)]">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-maroon-700" aria-hidden />
        <span>
          New staff: use the link in your invitation email to choose a password first. Students sign in at
          the{' '}
          <Link href="/portal/sign-in" className="text-maroon-700 hover:underline">
            student portal
          </Link>
          .
        </span>
      </p>
    </Container>
  )
}
