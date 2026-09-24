/**
 * The documents an applicant uploads with the form (FR-17), and the checks the browser and
 * the server share: which are required, which types are accepted, and the size cap.
 *
 * This file runs in the browser too, so it only looks at what a file claims to be. The
 * server then checks the actual bytes, strips image metadata and renames the file
 * (see document-intake.ts).
 */

import type { ApplicantType } from './admissions-schema'

export type ApplicationDocumentKind = 'birth' | 'results' | 'photo'

export interface ApplicationDocumentRule {
  kind: ApplicationDocumentKind
  /** Name of the file input, matching the error keys the form shows. */
  field: `documents.${ApplicationDocumentKind}`
  label: string
  hint: string
  requiredFor: readonly ApplicantType[]
}

export const APPLICATION_DOCUMENTS: readonly ApplicationDocumentRule[] = [
  {
    kind: 'birth',
    field: 'documents.birth',
    label: 'Birth certificate',
    hint: 'A clear photo or scan of the whole certificate.',
    requiredFor: ['s1', 's5', 'transfer'],
  },
  {
    kind: 'results',
    field: 'documents.results',
    label: 'Result slip',
    hint: 'The PLE slip for Senior One, the UCE slip for Senior Five. Optional for transfers.',
    requiredFor: ['s1', 's5'],
  },
  {
    kind: 'photo',
    field: 'documents.photo',
    label: 'Passport photograph',
    hint: 'A recent photo of the student’s face against a plain background.',
    requiredFor: ['s1', 's5', 'transfer'],
  },
]

/** Families pay for data, and a phone photo of a document fits comfortably in this. */
export const APPLICATION_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024

export const APPLICATION_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const

/** What the browser's file picker is told to offer. */
export const APPLICATION_DOCUMENT_ACCEPT = APPLICATION_DOCUMENT_TYPES.join(',')

/** The parts of a File these checks read. */
export interface ChosenFile {
  name: string
  type: string
  size: number
}

type FormEntries = Pick<FormData, 'get'>

/** An empty file input still posts a nameless, empty file. */
export function chosenFile(form: FormEntries, field: string): File | null {
  const value = form.get(field)
  if (typeof value === 'string' || value === null) return null
  return value.size > 0 || value.name !== '' ? value : null
}

/** The problem with a chosen file, going by what it claims to be, or null. */
export function declaredFileProblem(file: ChosenFile): string | null {
  if (file.size === 0) return 'That file is empty. Please choose it again.'
  if (!(APPLICATION_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
    return 'Choose a PDF or a photo (JPEG, PNG or WebP).'
  }
  if (file.size > APPLICATION_DOCUMENT_MAX_BYTES) {
    return 'That file is larger than 5 MB. Try a smaller photo or scan.'
  }
  return null
}

export interface ChosenDocument {
  kind: ApplicationDocumentKind
  field: string
  file: File
}

/** Checks the document inputs for one applicant type. Errors are keyed by input name. */
export function readDocuments(
  form: FormEntries,
  applicantType: string,
): { documents: ChosenDocument[]; errors: Record<string, string> } {
  const documents: ChosenDocument[] = []
  const errors: Record<string, string> = {}

  for (const rule of APPLICATION_DOCUMENTS) {
    const file = chosenFile(form, rule.field)
    if (!file) {
      if ((rule.requiredFor as readonly string[]).includes(applicantType)) {
        errors[rule.field] = `Add the ${rule.label.toLowerCase()}.`
      }
      continue
    }
    const problem = declaredFileProblem(file)
    if (problem) errors[rule.field] = problem
    else documents.push({ kind: rule.kind, field: rule.field, file })
  }

  return { documents, errors }
}
