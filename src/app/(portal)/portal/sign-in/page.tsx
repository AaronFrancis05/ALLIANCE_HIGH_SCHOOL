/**
 * Student sign-in (FR-10).
 */

import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HelpCircle, KeyRound } from 'lucide-react'
import { Container, Card } from '../../../../components/ui'
import { SignInForm } from '../../../../components/portal/SignInForm'
import { currentStudent } from '../../../../lib/session'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default async function SignInPage() {
  // Already signed in: no reason to show the form again.
  if (await currentStudent()) redirect('/portal')

  return (
    <Container className="max-w-md">
      <h1 className="text-center text-3xl">Sign in</h1>
      <p className="mt-2 text-center text-[var(--text-muted)]">
        Use the number on your school ID card.
      </p>

      <Card className="mt-8 p-6 sm:p-8">
        <SignInForm />

        <div className="mt-6 border-t border-cream-200 pt-5 text-center">
          <p className="text-sm text-[var(--text-muted)]">Signing in for the first time?</p>
          <Link
            href="/portal/first-time"
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-maroon-700 px-6 text-sm font-semibold text-maroon-700 transition-colors hover:bg-maroon-50"
          >
            <KeyRound className="h-4 w-4" aria-hidden />
            First-time sign-in
          </Link>
        </div>
      </Card>

      <p className="mt-5 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
        <HelpCircle className="h-4 w-4 shrink-0 text-maroon-700" aria-hidden />
        Forgot your password? Ask at the school office.
      </p>
    </Container>
  )
}
