/**
 * Student sign-in (FR-10).
 */

import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { HelpCircle } from 'lucide-react'
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
        Use the admission number printed on your school identity card.
      </p>

      <Card className="mt-8 p-6 sm:p-8">
        <SignInForm />
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="flex items-center gap-2 font-display text-base">
          <HelpCircle className="h-5 w-5 text-maroon-700" aria-hidden />
          Trouble signing in?
        </h2>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-body)]">
          <li>Type the admission number exactly as it appears, including the slashes.</li>
          <li>After five wrong attempts the account locks for fifteen minutes.</li>
          <li>
            If you have forgotten your password, ask at the school office. Staff can reset it for
            you — nobody can tell you what your old one was.
          </li>
        </ul>
      </Card>
    </Container>
  )
}
