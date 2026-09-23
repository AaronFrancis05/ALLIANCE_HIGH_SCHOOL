'use client'

/**
 * The online application form (FR-16).
 *
 * The browser runs the same parser and schema as the server, only to save a round trip on
 * a slow connection; the server checks again and is the only thing that decides.
 *
 * It also works without JavaScript: the section for each kind of applicant is shown with
 * CSS (`:has(:checked)`), the form posts normally, and the server's errors come back
 * against the same field names.
 */

import React, { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  APPLICANT_TYPES,
  PLE_GRADES,
  PLE_SUBJECTS,
  pleAggregateFromGrades,
  TRANSFER_CLASSES,
  UCE_GRADES,
} from '../../lib/admissions-schema'
import { parseApplicationForm, UCE_RESULT_ROWS, type FieldErrors } from '../../lib/application-form'
import { APPLICATION_DOCUMENT_ACCEPT, APPLICATION_DOCUMENTS } from '../../lib/application-documents'
import { submitApplicationAction, type ApplyState } from '../../app/(site)/admissions/apply/actions'
import { Card } from '../ui'
import { cn } from '../../lib/cn'

const INPUT =
  'mt-1.5 min-h-12 w-full rounded-lg border bg-white px-3 text-base text-ink-900 focus:border-maroon-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-600'

const RADIO_CARD =
  'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-cream-300 bg-white px-3 py-2 text-[var(--text-body)] has-[:checked]:border-maroon-600 has-[:checked]:bg-maroon-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-maroon-600'

/** Inputs share their error and value lookups through this context. */
interface FormContext {
  errors: FieldErrors
  values: Record<string, string>
}

const Context = React.createContext<FormContext>({ errors: {}, values: {} })

function errorId(name: string) {
  return `${name.replace(/\./g, '-')}-error`
}

function inputId(name: string) {
  return `field-${name.replace(/\./g, '-')}`
}

function FieldError({ name }: { name: string }) {
  const { errors } = React.useContext(Context)
  if (!errors[name]) return null
  return (
    <p id={errorId(name)} className="mt-1.5 text-sm text-maroon-800">
      {errors[name]}
    </p>
  )
}

/** Props every input gets: id, name, the value to refill with, and its error wiring. */
function useField(name: string) {
  const { errors, values } = React.useContext(Context)
  const invalid = Boolean(errors[name])
  return {
    id: inputId(name),
    name,
    defaultValue: values[name] ?? '',
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? errorId(name) : undefined,
    className: cn(INPUT, invalid ? 'border-maroon-700' : 'border-cream-300'),
  }
}

function Label({ name, children, optional }: { name: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={inputId(name)} className="block text-sm font-medium text-[var(--text-strong)]">
      {children}
      {optional ? <span className="font-normal text-[var(--text-muted)]"> (optional)</span> : null}
    </label>
  )
}

function TextField({
  name,
  label,
  optional,
  hint,
  ...rest
}: {
  name: string
  label: string
  optional?: boolean
  hint?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const field = useField(name)
  return (
    <div>
      <Label name={name} optional={optional}>
        {label}
      </Label>
      {hint ? <p className="mt-0.5 text-sm text-[var(--text-muted)]">{hint}</p> : null}
      <input type="text" {...rest} {...field} />
      <FieldError name={name} />
    </div>
  )
}

function TextArea({ name, label, optional, hint }: { name: string; label: string; optional?: boolean; hint?: string }) {
  const field = useField(name)
  return (
    <div>
      <Label name={name} optional={optional}>
        {label}
      </Label>
      {hint ? <p className="mt-0.5 text-sm text-[var(--text-muted)]">{hint}</p> : null}
      <textarea rows={3} {...field} className={cn(field.className, 'py-2')} />
      <FieldError name={name} />
    </div>
  )
}

function Select({
  name,
  label,
  options,
  hideLabel,
}: {
  name: string
  label: string
  options: readonly { value: string; label: string }[]
  hideLabel?: boolean
}) {
  const field = useField(name)
  return (
    <div>
      <label htmlFor={field.id} className={hideLabel ? 'sr-only' : 'block text-sm font-medium text-[var(--text-strong)]'}>
        {label}
      </label>
      <select {...field}>
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError name={name} />
    </div>
  )
}

function RadioGroup({
  name,
  legend,
  options,
}: {
  name: string
  legend: string
  options: readonly { value: string; label: string }[]
}) {
  const { errors, values } = React.useContext(Context)
  const invalid = Boolean(errors[name])
  return (
    <fieldset aria-describedby={invalid ? errorId(name) : undefined}>
      <legend className="text-sm font-medium text-[var(--text-strong)]">{legend}</legend>
      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.value} className={RADIO_CARD}>
            <input
              type="radio"
              id={`${inputId(name)}-${option.value}`}
              name={name}
              value={option.value}
              defaultChecked={values[name] === option.value}
              className="h-5 w-5 shrink-0 accent-maroon-700"
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldError name={name} />
    </fieldset>
  )
}

function Group({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-5 border-t border-cream-300 pt-8', className)}>
      <h2 className="font-display text-xl">{title}</h2>
      {children}
    </section>
  )
}

const GRADE_OPTIONS = PLE_GRADES.map((grade) => ({ value: grade, label: grade }))
const UCE_GRADE_OPTIONS = UCE_GRADES.map((grade) => ({ value: grade, label: grade }))

function PleSection({ aggregate }: { aggregate: number | null }) {
  return (
    <Group title="PLE results" className="hidden group-has-[#field-applicantType-s1:checked]/apply:block">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="pleIndexNumber" label="PLE index number" autoCapitalize="characters" spellCheck={false} />
        <TextField name="pleYear" label="Year PLE was sat" optional inputMode="numeric" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {PLE_SUBJECTS.map((subject) => (
          <Select key={subject.key} name={`pleGrades.${subject.key}`} label={subject.label} options={GRADE_OPTIONS} />
        ))}
      </div>
      <p className="text-sm text-[var(--text-muted)]" aria-live="polite">
        Total aggregate:{' '}
        <strong className="text-[var(--text-strong)]">{aggregate ?? 'worked out from the four grades'}</strong>
      </p>
    </Group>
  )
}

function UceSection() {
  const { errors } = React.useContext(Context)
  return (
    <Group title="UCE results" className="hidden group-has-[#field-applicantType-s5:checked]/apply:block">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="uceIndexNumber" label="UCE index number" autoCapitalize="characters" spellCheck={false} />
        <TextField name="uceYear" label="Year UCE was sat" optional inputMode="numeric" />
      </div>
      <TextField name="combination" label="Subject combination wanted" hint="For example PCM or HEG." autoCapitalize="characters" />
      <fieldset aria-describedby={errors.uceResults ? errorId('uceResults') : undefined}>
        <legend className="text-sm font-medium text-[var(--text-strong)]">Grade in each subject</legend>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">At least six subjects. Leave spare rows empty.</p>
        <FieldError name="uceResults" />
        <div className="mt-2 space-y-3">
          {Array.from({ length: UCE_RESULT_ROWS }, (_, row) => (
            <div key={row} className="grid grid-cols-[1fr_6.5rem] gap-3">
              <TextField name={`uceResults.${row}.subject`} label={`Subject ${row + 1}`} />
              <Select name={`uceResults.${row}.grade`} label={`Grade ${row + 1}`} options={UCE_GRADE_OPTIONS} />
            </div>
          ))}
        </div>
      </fieldset>
    </Group>
  )
}

function TransferSection() {
  return (
    <Group title="Transfer details" className="hidden group-has-[#field-applicantType-transfer:checked]/apply:block">
      <div className="grid gap-5 sm:grid-cols-2">
        <Select name="classSought" label="Class wanted" options={TRANSFER_CLASSES} />
        <TextField name="currentClass" label="Class the student is in now" />
      </div>
      <TextArea name="reasonForTransfer" label="Why the student is changing school" />
      <TextArea name="lastReportSummary" label="Summary of the last school report" optional />
    </Group>
  )
}

/** A file input. It cannot be refilled after a round trip; the error message says so. */
function FileField({ name, label, hint }: { name: string; label: string; hint: string }) {
  const { errors } = React.useContext(Context)
  const invalid = Boolean(errors[name])
  return (
    <div>
      <Label name={name}>{label}</Label>
      <p id={`${inputId(name)}-hint`} className="mt-0.5 text-sm text-[var(--text-muted)]">
        {hint}
      </p>
      <input
        type="file"
        id={inputId(name)}
        name={name}
        accept={APPLICATION_DOCUMENT_ACCEPT}
        aria-invalid={invalid || undefined}
        aria-describedby={[`${inputId(name)}-hint`, invalid ? errorId(name) : null].filter(Boolean).join(' ')}
        className={cn(
          'mt-1.5 block w-full rounded-lg border bg-white p-2 text-sm text-ink-900 file:mr-3 file:min-h-10 file:rounded-md file:border-0 file:bg-maroon-50 file:px-3 file:font-medium file:text-maroon-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-600',
          invalid ? 'border-maroon-700' : 'border-cream-300',
        )}
      />
      <FieldError name={name} />
    </div>
  )
}

function DocumentsSection() {
  return (
    <Group title="Documents">
      <p className="text-[var(--text-body)]">
        A PDF or a clear photo of each, up to 5 MB. Photos taken on a phone are fine; hold the
        phone straight above the page in good light.
      </p>
      {APPLICATION_DOCUMENTS.map((document) => (
        <FileField key={document.kind} name={document.field} label={document.label} hint={document.hint} />
      ))}
    </Group>
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
      {pending ? 'Sending…' : 'Send the application'}
    </button>
  )
}

function Submitted({ trackingCode }: { trackingCode: string }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])

  return (
    <Card className="p-6 sm:p-8">
      <CheckCircle2 className="h-10 w-10 text-maroon-700" aria-hidden />
      <h2 ref={heading} tabIndex={-1} className="mt-4 font-display text-2xl focus:outline-none">
        Application received
      </h2>
      <p className="mt-3 text-[var(--text-body)]">Your application reference is:</p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-wider text-[var(--text-strong)]" data-testid="tracking-code">
        {trackingCode}
      </p>
      <p className="mt-4 text-[var(--text-body)]">
        Write this reference down or take a screenshot, and quote it whenever you contact the
        admissions office about this application.
      </p>
      <p className="mt-3 text-[var(--text-body)]">
        The admissions office will review the application and contact you on the telephone
        number you gave. Keep the documents listed on the{' '}
        <Link href="/admissions#requirements" className="text-maroon-700 underline">
          admissions page
        </Link>{' '}
        ready.
      </p>
    </Card>
  )
}

export function ApplicationForm() {
  const [state, formAction] = useActionState<ApplyState, FormData>(submitApplicationAction, { status: 'idle' })
  const [clientErrors, setClientErrors] = useState<FieldErrors>({})
  const [aggregate, setAggregate] = useState<number | null>(null)
  const summary = useRef<HTMLDivElement>(null)

  const serverErrors = state.status === 'error' ? (state.errors ?? {}) : {}
  const errors = Object.keys(clientErrors).length ? clientErrors : serverErrors
  const values = state.status === 'error' ? (state.values ?? {}) : {}
  const message =
    Object.keys(clientErrors).length > 0
      ? 'Some answers need attention. Please check the highlighted questions.'
      : state.status === 'error'
        ? state.message
        : undefined

  useEffect(() => {
    if (state.status === 'error') summary.current?.focus()
  }, [state])

  if (state.status === 'submitted') return <Submitted trackingCode={state.trackingCode} />

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const result = parseApplicationForm(new FormData(event.currentTarget))
    if (result.success) {
      setClientErrors({})
      return
    }
    event.preventDefault()
    setClientErrors(result.errors)
    requestAnimationFrame(() => summary.current?.focus())
  }

  function onChange(event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget)
    const grades = Object.fromEntries(PLE_SUBJECTS.map((subject) => [subject.key, String(form.get(`pleGrades.${subject.key}`) ?? '')]))
    setAggregate(Object.values(grades).every(Boolean) ? pleAggregateFromGrades(grades) : null)
  }

  return (
    <Context.Provider value={{ errors, values }}>
      <form action={formAction} onSubmit={onSubmit} onChange={onChange} noValidate className="group/apply space-y-8">
        <div ref={summary} tabIndex={-1} className="focus:outline-none">
          {message ? (
            <div
              role="alert"
              className="flex gap-2 rounded-[var(--radius-card)] border border-maroon-200 bg-maroon-50 p-3 text-sm text-maroon-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p>{message}</p>
                {errors.form ? <p className="mt-1">{errors.form}</p> : null}
              </div>
            </div>
          ) : null}
        </div>

        <RadioGroup name="applicantType" legend="What is the student applying for?" options={APPLICANT_TYPES} />

        <Group title="The student">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="firstName" label="First name" autoComplete="off" />
            <TextField name="lastName" label="Surname" autoComplete="off" />
          </div>
          <RadioGroup
            name="gender"
            legend="Gender"
            options={[
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
            ]}
          />
          <TextField name="dateOfBirth" label="Date of birth" type="date" max={new Date().toISOString().slice(0, 10)} />
          <TextField name="formerSchool" label="Current or last school" />
          <RadioGroup
            name="residence"
            legend="Boarding or day"
            options={[
              { value: 'boarding', label: 'Boarding' },
              { value: 'day', label: 'Day' },
            ]}
          />
        </Group>

        <PleSection aggregate={aggregate} />
        <UceSection />
        <TransferSection />

        <Group title="Parent or guardian">
          <TextField name="guardianName" label="Full name" autoComplete="name" />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="guardianPhone" label="Telephone" type="tel" autoComplete="tel" hint="The office will call this number." />
            <TextField name="guardianEmail" label="Email" type="email" autoComplete="email" optional />
          </div>
        </Group>

        <DocumentsSection />

        <Group title="Anything else">
          <TextArea name="comment" label="Anything the admissions office should know" optional />

          <div>
            <label className="flex min-h-11 cursor-pointer gap-3 text-[var(--text-body)]">
              <input
                type="checkbox"
                id={inputId('consent')}
                name="consent"
                defaultChecked={values.consent === 'on'}
                aria-describedby={errors.consent ? errorId('consent') : undefined}
                className="mt-0.5 h-5 w-5 shrink-0 accent-maroon-700"
              />
              <span>
                I confirm these details are true, and I have read how the school uses them in the{' '}
                <Link href="/privacy" className="text-maroon-700 underline">
                  privacy notice
                </Link>
                .
              </span>
            </label>
            <FieldError name="consent" />
          </div>

          {/* Hidden from people; a bot that fills every box fills this one too. */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">Leave this empty</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>

          <SubmitButton />
        </Group>
      </form>
    </Context.Provider>
  )
}
