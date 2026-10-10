'use client'

/**
 * First-time sign-in, in two steps: the admission number (a code is emailed), then the code
 * and a new password. The admission number travels in the form, never in the URL.
 *
 * The browser checks nothing that matters; the server actions validate everything.
 */

import React, { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, MailCheck } from 'lucide-react'
import {
  completeSetupAction,
  requestSetupCodeAction,
  type FirstTimeState,
} from '../../app/(portal)/portal/first-time/actions'
import { MIN_PASSWORD_LENGTH } from '../../lib/student-password'

const INPUT =
  'mt-1.5 min-h-12 w-full rounded-lg border border-cream-300 bg-white px-3 text-base text-ink-900 focus:border-maroon-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-600'
const LABEL = 'block text-sm font-medium text-[var(--text-strong)]'

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-maroon-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-maroon-800 disabled:opacity-70"
    >
      {pending ? busy : idle}
    </button>
  )
}

function ResendButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-md px-1 text-sm font-semibold text-maroon-700 underline-offset-4 hover:underline disabled:opacity-70"
    >
      {pending ? 'Sending…' : 'Send a new code'}
    </button>
  )
}

function Message({ state }: { state: FirstTimeState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="flex gap-2 rounded-[var(--radius-card)] border border-maroon-200 bg-maroon-50 p-3 text-sm text-maroon-900"
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {state.error}
      </p>
    )
  }
  if (state.notice) {
    return (
      <p
        role="status"
        className="flex gap-2 rounded-[var(--radius-card)] border border-cream-300 bg-cream-50 p-3 text-sm text-[var(--text-body)]"
      >
        <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-maroon-700" aria-hidden />
        {state.notice}
      </p>
    )
  }
  return null
}

export function FirstTimeForm() {
  const [requested, requestCode] = useActionState<FirstTimeState, FormData>(requestSetupCodeAction, {
    step: 'number',
  })
  const [completed, complete] = useActionState<FirstTimeState, FormData>(completeSetupAction, {
    step: 'code',
  })
  // Lets the student go back and correct the admission number.
  const [startedOver, setStartedOver] = useState<FirstTimeState | null>(null)

  const onCodeStep = requested.step === 'code' && startedOver !== requested
  const admissionNo = requested.admissionNo ?? ''

  if (!onCodeStep) {
    return (
      <form action={requestCode} className="space-y-5" noValidate>
        <Message state={startedOver === requested ? { step: 'number' } : requested} />
        <div>
          <label htmlFor="admissionNo" className={LABEL}>
            Admission number
          </label>
          <input
            id="admissionNo"
            name="admissionNo"
            type="text"
            required
            defaultValue={admissionNo}
            autoComplete="username"
            autoCapitalize="characters"
            spellCheck={false}
            className={INPUT}
          />
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">Exactly as it is on your school ID card.</p>
        </div>
        <SubmitButton idle="Email me a code" busy="Sending…" />
      </form>
    )
  }

  return (
    <div className="space-y-5">
      <Message state={completed.error ? completed : requested} />

      <form action={complete} className="space-y-5" noValidate>
        <input type="hidden" name="admissionNo" value={admissionNo} />
        <p className="text-sm text-[var(--text-body)]">
          Setting up <strong className="font-semibold text-[var(--text-strong)]">{admissionNo}</strong>.{' '}
          <button
            type="button"
            onClick={() => setStartedOver(requested)}
            className="min-h-11 rounded-md px-1 font-semibold text-maroon-700 underline-offset-4 hover:underline"
          >
            Not you?
          </button>
        </p>

        <div>
          <label htmlFor="code" className={LABEL}>
            6-digit code from the email
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className={`${INPUT} tracking-[0.4em]`}
          />
        </div>

        <div>
          <label htmlFor="password" className={LABEL}>
            Choose a password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            aria-describedby="password-hint"
            className={INPUT}
          />
          <p id="password-hint" className="mt-1.5 text-sm text-[var(--text-muted)]">
            At least {MIN_PASSWORD_LENGTH} characters, with a letter and a number. Do not share it.
          </p>
        </div>

        <div>
          <label htmlFor="confirm" className={LABEL}>
            Type the password again
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            className={INPUT}
          />
        </div>

        <SubmitButton idle="Set password and sign in" busy="Setting up…" />
      </form>

      <form action={requestCode} className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <input type="hidden" name="admissionNo" value={admissionNo} />
        <span className="text-[var(--text-muted)]">No email after a few minutes?</span>
        <ResendButton />
      </form>
    </div>
  )
}
