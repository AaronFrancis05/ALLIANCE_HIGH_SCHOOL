'use client'

/**
 * A staff portal form: posts to a server action and shows what it answered. The fields are
 * passed in as children. The browser checks nothing that counts; the server action
 * validates everything (AGENTS.md section 2.1).
 */

import React, { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export interface ActionFormState {
  error?: string
  success?: string
}

type FormAction = (previous: ActionFormState, formData: FormData) => Promise<ActionFormState>

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-maroon-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-maroon-800 disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export function ActionForm({
  action,
  submitLabel,
  pendingLabel,
  children,
}: {
  action: FormAction
  submitLabel: string
  pendingLabel: string
  children: React.ReactNode
}) {
  const [state, formAction] = useActionState<ActionFormState, FormData>(action, {})

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
      {state.success ? (
        <p
          role="status"
          className="flex gap-2 rounded-[var(--radius-card)] border border-green-200 bg-green-50 p-3 text-sm text-green-900"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.success}
        </p>
      ) : null}

      {children}

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  )
}

export const inputClass =
  'mt-1.5 min-h-12 w-full rounded-lg border border-cream-300 bg-white px-3 text-base text-ink-900 focus:border-maroon-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-600'

export const labelClass = 'block text-sm font-medium text-[var(--text-strong)]'
