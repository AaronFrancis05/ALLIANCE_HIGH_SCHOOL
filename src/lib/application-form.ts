/**
 * Turns the posted application form into the shape `applicationSchema` checks (FR-16).
 *
 * The browser and the server both run the form through this function and then the same
 * schema, so the two can never disagree about what is valid. Field names in the form
 * match the schema's paths (`pleGrades.english`, `uceResults.3.grade`), so an error
 * reported against a path can be shown next to the input with that name.
 *
 * The PLE aggregate is worked out here from the four grades, never taken from the form,
 * so a family cannot submit an aggregate that does not match their grades.
 */

import type { z } from 'zod'
import {
  applicationSchema,
  PLE_SUBJECTS,
  pleAggregateFromGrades,
  type ApplicationInput,
} from './admissions-schema'
import { readDocuments, type ChosenDocument } from './application-documents'

/** How many subject rows the UCE results table offers. Blank rows are ignored. */
export const UCE_RESULT_ROWS = 10

type FormEntries = Pick<FormData, 'get'>

function text(form: FormEntries, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

/** A blank box means "not given", so an optional number stays optional. */
function optionalNumber(form: FormEntries, name: string): number | undefined {
  const value = text(form, name).trim()
  return value === '' ? undefined : Number(value)
}

function pleFields(form: FormEntries) {
  const pleGrades = Object.fromEntries(
    PLE_SUBJECTS.map((subject) => [subject.key, text(form, `pleGrades.${subject.key}`)]),
  )
  return {
    pleIndexNumber: text(form, 'pleIndexNumber'),
    pleYear: optionalNumber(form, 'pleYear'),
    pleGrades,
    pleAggregate: pleAggregateFromGrades(pleGrades),
  }
}

function uceFields(form: FormEntries) {
  const uceResults = Array.from({ length: UCE_RESULT_ROWS }, (_, row) => ({
    subject: text(form, `uceResults.${row}.subject`),
    grade: text(form, `uceResults.${row}.grade`),
  })).filter((result) => result.subject.trim() !== '' || result.grade !== '')

  return {
    uceIndexNumber: text(form, 'uceIndexNumber'),
    uceYear: optionalNumber(form, 'uceYear'),
    uceResults,
    combination: text(form, 'combination'),
  }
}

function transferFields(form: FormEntries) {
  return {
    classSought: text(form, 'classSought'),
    currentClass: text(form, 'currentClass'),
    reasonForTransfer: text(form, 'reasonForTransfer'),
    lastReportSummary: text(form, 'lastReportSummary'),
  }
}

/** Reads the form. Only the section for the chosen applicant type is read. */
export function readApplicationForm(form: FormEntries): Record<string, unknown> {
  const applicantType = text(form, 'applicantType')

  const base = {
    applicantType,
    firstName: text(form, 'firstName'),
    lastName: text(form, 'lastName'),
    gender: text(form, 'gender'),
    dateOfBirth: text(form, 'dateOfBirth'),
    formerSchool: text(form, 'formerSchool'),
    guardianName: text(form, 'guardianName'),
    guardianPhone: text(form, 'guardianPhone'),
    guardianEmail: text(form, 'guardianEmail'),
    residence: text(form, 'residence'),
    comment: text(form, 'comment'),
    consent: form.get('consent') === 'on',
    website: text(form, 'website'),
  }

  if (applicantType === 's1') return { ...base, ...pleFields(form) }
  if (applicantType === 's5') return { ...base, ...uceFields(form) }
  if (applicantType === 'transfer') return { ...base, ...transferFields(form) }
  return base
}

/** Error messages keyed by form field name. The first problem with each field wins. */
export type FieldErrors = Record<string, string>

export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of error.issues) {
    const name = issue.path.join('.') || 'form'
    errors[name] ??= issue.message
  }
  // The aggregate is worked out from the grades, so it is only out of range when a grade is
  // missing, and the missing grade already says so. Otherwise it belongs to the grades.
  if (errors.pleAggregate) {
    const gradeMissing = Object.keys(errors).some((name) => name.startsWith('pleGrades.'))
    if (!gradeMissing) errors['pleGrades.mathematics'] = errors.pleAggregate
    delete errors.pleAggregate
  }
  // A missing applicant type is reported by Zod against the discriminator.
  if (errors.applicantType) errors.applicantType = 'Choose what the student is applying for'
  return errors
}

export type ParsedApplication =
  | { success: true; data: ApplicationInput; documents: ChosenDocument[] }
  | { success: false; errors: FieldErrors }

/** The one check the browser and the server both run: the answers, then the documents. */
export function parseApplicationForm(form: FormEntries): ParsedApplication {
  const result = applicationSchema.safeParse(readApplicationForm(form))
  const { documents, errors: documentErrors } = readDocuments(form, text(form, 'applicantType'))

  const errors = { ...(result.success ? {} : fieldErrorsFrom(result.error)), ...documentErrors }
  if (!result.success || Object.keys(errors).length) return { success: false, errors }
  return { success: true, data: result.data, documents }
}
