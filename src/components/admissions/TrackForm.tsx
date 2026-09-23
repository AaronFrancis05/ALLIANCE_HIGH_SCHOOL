'use client'

/**
 * Check an application's progress (FR-18). Works without JavaScript: it is a plain form
 * post, and the answer is rendered by the server.
 */

import React, { useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CalendarDays, CheckCircle2, Clock } from 'lucide-react'
import { trackApplicationAction, type TrackState } from '../../app/(site)/admissions/track/actions'
import { statusForFamily } from '../../lib/application-status'
import type { TrackingResult } from '../../lib/application-tracking'
import { Card } from '../ui'

const INPUT =
  'mt-1.5 min-h-12 w-full rounded-lg border border-cream-300 bg-white px-3 text-base text-ink-900 focus:border-maroon-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-600'

const CLASS_NAMES: Record<string, string> = {
  S1: 'Senior One',
  S2: 'Senior Two',
  S3: 'Senior Three',
  S4: 'Senior Four',
  S5: 'Senior Five',
  S6: 'Senior Six',
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-UG', { dateStyle: 'long', timeZone: 'Africa/Kampala' }).format(new Date(value))
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-maroon-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-maroon-800 disabled:opacity-70 sm:w-auto"
    >
      {pending ? 'Checking…' : 'Check progress'}
    </button>
  )
}

function Result({ result }: { result: TrackingResult }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const status = statusForFamily(result.status)
  const Icon = status.final ? CheckCircle2 : Clock

  return (
    <Card className="p-6 sm:p-8">
      <div data-testid="tracking-result">
        <p className="font-mono text-sm tracking-wider text-[var(--text-muted)]">{result.trackingCode}</p>
        <div className="mt-3 flex items-start gap-3">
          <Icon className="mt-1 h-7 w-7 shrink-0 text-maroon-700" aria-hidden />
          <div>
            <h2 ref={heading} tabIndex={-1} className="font-display text-2xl focus:outline-none">
              {status.title}
            </h2>
            <p className="mt-2 text-[var(--text-body)]">{status.explanation}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-[var(--text-strong)]">Class applied for</dt>
            <dd className="text-[var(--text-body)]">{CLASS_NAMES[result.classSought] ?? result.classSought}</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--text-strong)]">Submitted</dt>
            <dd className="text-[var(--text-body)]">{formatDate(result.submittedOn)}</dd>
          </div>
          {result.interviewDate ? (
            <div className="sm:col-span-2">
              <dt className="flex items-center gap-1.5 font-medium text-[var(--text-strong)]">
                <CalendarDays className="h-4 w-4" aria-hidden /> Interview or test date
              </dt>
              <dd className="text-[var(--text-body)]">{formatDate(result.interviewDate)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Questions about this application?{' '}
          <Link href="/contact" className="text-maroon-700 underline">
            Contact the school
          </Link>{' '}
          and quote the reference.
        </p>
      </div>
    </Card>
  )
}

export function TrackForm() {
  const [state, formAction] = useActionState<TrackState, FormData>(trackApplicationAction, { status: 'idle' })
  const values = state.status === 'error' ? (state.values ?? {}) : {}

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-5" noValidate>
        {state.status === 'error' ? (
          <p
            role="alert"
            className="flex gap-2 rounded-[var(--radius-card)] border border-maroon-200 bg-maroon-50 p-3 text-sm text-maroon-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {state.message}
          </p>
        ) : null}

        <div>
          <label htmlFor="trackingCode" className="block text-sm font-medium text-[var(--text-strong)]">
            Application reference
          </label>
          <input
            id="trackingCode"
            name="trackingCode"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="AHSN-7Q4K2P"
            defaultValue={values.trackingCode ?? ''}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="guardianPhone" className="block text-sm font-medium text-[var(--text-strong)]">
            Parent or guardian telephone
          </label>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">The number given on the application form.</p>
          <input
            id="guardianPhone"
            name="guardianPhone"
            type="tel"
            autoComplete="tel"
            defaultValue={values.guardianPhone ?? ''}
            className={INPUT}
          />
        </div>
        <SubmitButton />
      </form>

      {state.status === 'found' ? (
        <Result key={`${state.result.trackingCode}-${state.result.status}`} result={state.result} />
      ) : null}
    </div>
  )
}
