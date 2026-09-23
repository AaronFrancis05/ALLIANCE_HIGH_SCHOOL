'use client'

/**
 * Student sign-in form.
 *
 * The browser validates only to save a round trip; the server validates properly and is
 * the only thing that decides (AGENTS.md section 2.1).
 */

import React, { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle } from 'lucide-react'
import { signInAction, type SignInState } from '../../app/(portal)/portal/actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-maroon-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-maroon-800 disabled:opacity-70"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function SignInForm() {
  const [state, formAction] = useActionState<SignInState, FormData>(signInAction, {})

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="flex gap-2 rounded-[var(--radius-card)] border border-maroon-200 bg-maroon-50 p-3 text-sm text-maroon-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="admissionNo" className="block text-sm font-medium text-[var(--text-strong)]">
          Admission number
        </label>
        <input
          id="admissionNo"
          name="admissionNo"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="AHSN/25/001"
          className="mt-1.5 min-h-12 w-full rounded-lg border border-cream-300 bg-white px-3 text-base text-ink-900 focus:border-maroon-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-600"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--text-strong)]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 min-h-12 w-full rounded-lg border border-cream-300 bg-white px-3 text-base text-ink-900 focus:border-maroon-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-600"
        />
      </div>

      <SubmitButton />
    </form>
  )
}
