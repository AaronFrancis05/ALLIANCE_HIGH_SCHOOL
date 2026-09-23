'use client'

/**
 * The enquiry form on the contact page (FR-21).
 *
 * Same approach as the application form: the browser runs the shared schema to save a
 * round trip, the server checks again and decides, and it all works without JavaScript
 * (the alumni and careers questions are shown with CSS `:has(:checked)`).
 */

import React, { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { sendEnquiryAction, type EnquiryState } from '../../app/(site)/contact/actions'
import { ENQUIRY_TOPICS, parseEnquiryForm, type EnquiryErrors } from '../../lib/enquiry-schema'
import { cn } from '../../lib/cn'

const INPUT =
  'mt-1.5 min-h-12 w-full rounded-lg border bg-white px-3 text-base text-ink-900 focus:border-maroon-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-600'

const RADIO_CARD =
  'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-cream-300 bg-white px-3 py-2 text-[var(--text-body)] has-[:checked]:border-maroon-600 has-[:checked]:bg-maroon-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-maroon-600'

interface FieldProps {
  name: string
  label: string
  optional?: boolean
  hint?: string
  errors: EnquiryErrors
  values: Record<string, string>
  multiline?: boolean
  type?: string
  autoComplete?: string
}

function Field({ name, label, optional, hint, errors, values, multiline, type = 'text', autoComplete }: FieldProps) {
  const id = `enquiry-${name}`
  const invalid = Boolean(errors[name])
  const described = [hint ? `${id}-hint` : null, invalid ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  const shared = {
    id,
    name,
    defaultValue: values[name] ?? '',
    'aria-invalid': invalid || undefined,
    'aria-describedby': described,
    className: cn(INPUT, invalid ? 'border-maroon-700' : 'border-cream-300', multiline && 'py-2'),
  }
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text-strong)]">
        {label}
        {optional ? <span className="font-normal text-[var(--text-muted)]"> (optional)</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-[var(--text-muted)]">
          {hint}
        </p>
      ) : null}
      {multiline ? <textarea rows={5} {...shared} /> : <input type={type} autoComplete={autoComplete} {...shared} />}
      {invalid ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-maroon-800">
          {errors[name]}
        </p>
      ) : null}
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-maroon-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-maroon-800 disabled:opacity-70 sm:w-auto"
    >
      {pending ? 'Sending…' : 'Send message'}
    </button>
  )
}

function Sent() {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  return (
    <div className="rounded-[var(--radius-card)] border border-cream-300 bg-[var(--surface-raised)] p-6" data-testid="enquiry-sent">
      <CheckCircle2 className="h-9 w-9 text-maroon-700" aria-hidden />
      <h3 ref={heading} tabIndex={-1} className="mt-3 font-display text-xl focus:outline-none">
        Message sent
      </h3>
      <p className="mt-2 text-[var(--text-body)]">
        Thank you. The school office has your message and will reply using the details you gave.
      </p>
    </div>
  )
}

export function EnquiryForm() {
  const [state, formAction] = useActionState<EnquiryState, FormData>(sendEnquiryAction, { status: 'idle' })
  const [clientErrors, setClientErrors] = useState<EnquiryErrors>({})
  const summary = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state.status === 'error') summary.current?.focus()
  }, [state])

  if (state.status === 'sent') return <Sent />

  const errors = Object.keys(clientErrors).length ? clientErrors : state.status === 'error' ? (state.errors ?? {}) : {}
  const values = state.status === 'error' ? (state.values ?? {}) : {}
  const message = Object.keys(clientErrors).length
    ? 'Some answers need attention. Please check the highlighted questions.'
    : state.status === 'error'
      ? state.message
      : undefined

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const result = parseEnquiryForm(new FormData(event.currentTarget))
    if (result.success) {
      setClientErrors({})
      return
    }
    event.preventDefault()
    setClientErrors(result.errors)
    requestAnimationFrame(() => summary.current?.focus())
  }

  const shared = { errors, values }

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="group/enquiry space-y-5">
      <div ref={summary} tabIndex={-1} className="focus:outline-none">
        {message ? (
          <p
            role="alert"
            className="flex gap-2 rounded-[var(--radius-card)] border border-maroon-200 bg-maroon-50 p-3 text-sm text-maroon-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {message}
          </p>
        ) : null}
      </div>

      <fieldset aria-describedby={errors.form ? 'enquiry-form-error' : undefined}>
        <legend className="text-sm font-medium text-[var(--text-strong)]">What is your message about?</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {ENQUIRY_TOPICS.map((topic) => (
            <label key={topic.value} className={RADIO_CARD}>
              <input
                type="radio"
                id={`enquiry-topic-${topic.value}`}
                name="form"
                value={topic.value}
                defaultChecked={(values.form ?? 'contact') === topic.value}
                className="h-5 w-5 shrink-0 accent-maroon-700"
              />
              {topic.label}
            </label>
          ))}
        </div>
        {errors.form ? (
          <p id="enquiry-form-error" className="mt-1.5 text-sm text-maroon-800">
            {errors.form}
          </p>
        ) : null}
      </fieldset>

      <Field name="name" label="Your name" autoComplete="name" {...shared} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="email" label="Email" type="email" autoComplete="email" optional {...shared} />
        <Field name="phone" label="Telephone" type="tel" autoComplete="tel" optional {...shared} />
      </div>
      <p className="-mt-2 text-sm text-[var(--text-muted)]">Give at least one, so the office can reply.</p>

      <div className="hidden space-y-5 group-has-[#enquiry-topic-alumni:checked]/enquiry:block">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="yearOfCompletion" label="Year you finished at the school" {...shared} />
          <Field name="occupation" label="What you do now" optional {...shared} />
        </div>
      </div>
      <div className="hidden group-has-[#enquiry-topic-careers:checked]/enquiry:block">
        <Field name="position" label="Kind of post" hint="For example Biology teacher, or bursar's office." {...shared} />
      </div>

      <Field name="subject" label="Subject" optional {...shared} />
      <Field name="message" label="Message" multiline {...shared} />

      {/* Hidden from people; a bot that fills every box fills this one too. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="enquiry-website">Leave this empty</label>
        <input id="enquiry-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <SubmitButton />
    </form>
  )
}
