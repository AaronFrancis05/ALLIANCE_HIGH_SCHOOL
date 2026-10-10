/**
 * First-time sign-in (FR-10): set a password for a student record the school has created.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Container, Card } from '../../../../components/ui'
import { FirstTimeForm } from '../../../../components/portal/FirstTimeForm'
import { currentStudent } from '../../../../lib/session'

export const metadata: Metadata = {
  title: 'First-time sign-in',
  robots: { index: false, follow: false },
}

export default async function FirstTimePage() {
  if (await currentStudent()) redirect('/portal')

  return (
    <Container className="max-w-md">
      <h1 className="text-center text-3xl">First-time sign-in</h1>
      <p className="mt-2 text-center text-[var(--text-muted)]">
        The school has already made your account. We email a code to you or your parent or
        guardian, then you choose a password.
      </p>

      <Card className="mt-8 p-6 sm:p-8">
        <FirstTimeForm />
      </Card>

      <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
        No email address on your record? Ask at the school office to add one.
      </p>
      <p className="mt-3 text-center text-sm">
        <Link
          href="/portal/sign-in"
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-maroon-700 underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Already set up? Sign in
        </Link>
      </p>
    </Container>
  )
}
