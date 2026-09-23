/**
 * The shape of an online application (FR-16), shared by the browser form and the server
 * route so there is exactly one set of rules.
 *
 * Three kinds of applicant:
 *   s1        leaving primary school, entering Senior One. Gives PLE grades per subject,
 *             total aggregate, and uploads a photo of the result slip.
 *   s5        finished O-Level, entering Senior Five. Gives UCE results and the subject
 *             combination sought.
 *   transfer  a continuing student joining from another school in any of S2, S3, S4 or S6.
 */

import { z } from 'zod'

export const APPLICANT_TYPES = [
  { value: 's1', label: 'Senior One (joining from primary school)' },
  { value: 's5', label: 'Senior Five (joining after UCE)' },
  { value: 'transfer', label: 'Transfer or continuing student from another school' },
] as const

export type ApplicantType = (typeof APPLICANT_TYPES)[number]['value']

/** UNEB PLE grades run from Distinction 1 to Fail 9. */
export const PLE_GRADES = ['D1', 'D2', 'C3', 'C4', 'C5', 'C6', 'P7', 'P8', 'F9'] as const

/** The four PLE subjects every candidate sits. */
export const PLE_SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'english', label: 'English' },
  { key: 'science', label: 'Science' },
  { key: 'sst', label: 'Social Studies (S.S.T)' },
] as const

/** PLE aggregate: the sum of the four grades, so between 4 and 36. */
export const PLE_AGGREGATES = Array.from({ length: 33 }, (_, index) => index + 4)

export const UCE_GRADES = ['A', 'B', 'C', 'D', 'E', 'F', 'O'] as const

export const TRANSFER_CLASSES = [
  { value: 'S2', label: 'Senior Two' },
  { value: 'S3', label: 'Senior Three' },
  { value: 'S4', label: 'Senior Four' },
  { value: 'S6', label: 'Senior Six' },
] as const

const phone = z
  .string()
  .trim()
  .min(9, 'Enter a telephone number')
  .regex(/^[+\d][\d\s-]{8,17}$/, 'Enter a valid telephone number, for example 0702 601686')

const name = z.string().trim().min(2, 'Enter a name').max(60, 'That name is too long')

/** Fields every applicant fills in, whatever they are applying for. */
const baseSchema = z.object({
  firstName: name,
  lastName: name,
  gender: z.enum(['female', 'male'], { message: 'Choose a gender' }),
  dateOfBirth: z
    .string()
    .min(1, 'Enter the date of birth')
    .refine((value) => {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return false
      const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      return age >= 8 && age <= 25
    }, 'Check the date of birth'),
  formerSchool: z.string().trim().min(2, 'Enter the former school').max(120),
  guardianName: name.max(80),
  guardianPhone: phone,
  guardianEmail: z.string().trim().email('Enter a valid email address').or(z.literal('')),
  residence: z.enum(['boarding', 'day']),
  comment: z.string().trim().max(1000).optional(),
  /** Ids of files already uploaded through the documents route. */
  documentIds: z.array(z.string()).max(6).default([]),
  consent: z.literal(true, { message: 'Please confirm the details are correct' }),
  /** Must stay empty: filled in only by bots. */
  website: z.literal('').optional(),
})

const pleResultsSchema = z.object({
  pleIndexNumber: z
    .string()
    .trim()
    .min(4, 'Enter the PLE index number')
    .max(30)
    .regex(/^[\w/-]+$/, 'Use only letters, numbers, slashes and dashes'),
  pleYear: z
    .number()
    .int()
    .min(2000)
    .max(new Date().getFullYear())
    .optional(),
  pleGrades: z.object({
    mathematics: z.enum(PLE_GRADES, { message: 'Select a grade' }),
    english: z.enum(PLE_GRADES, { message: 'Select a grade' }),
    science: z.enum(PLE_GRADES, { message: 'Select a grade' }),
    sst: z.enum(PLE_GRADES, { message: 'Select a grade' }),
  }),
  pleAggregate: z
    .number({ message: 'Select your total aggregate' })
    .int()
    .min(4, 'The aggregate cannot be below 4')
    .max(36, 'The aggregate cannot be above 36'),
})

const uceResultsSchema = z.object({
  uceIndexNumber: z.string().trim().min(4, 'Enter the UCE index number').max(30),
  uceYear: z.number().int().min(2000).max(new Date().getFullYear()).optional(),
  uceResults: z
    .array(
      z.object({
        subject: z.string().trim().min(2, 'Enter the subject'),
        grade: z.enum(UCE_GRADES, { message: 'Select a grade' }),
      }),
    )
    .min(6, 'Enter at least six subjects')
    .max(12),
  combination: z.string().trim().min(2, 'Enter the combination you want, for example PCM').max(40),
})

const transferSchema = z.object({
  classSought: z.enum(['S2', 'S3', 'S4', 'S6'], { message: 'Choose the class' }),
  currentClass: z.string().trim().min(2, 'Enter the class currently in').max(30),
  reasonForTransfer: z.string().trim().min(10, 'Please give a short reason').max(500),
  lastReportSummary: z.string().trim().max(500).optional(),
})

export const applicationSchema = z.discriminatedUnion('applicantType', [
  baseSchema.extend({ applicantType: z.literal('s1') }).merge(pleResultsSchema),
  baseSchema.extend({ applicantType: z.literal('s5') }).merge(uceResultsSchema),
  baseSchema.extend({ applicantType: z.literal('transfer') }).merge(transferSchema),
])

export type ApplicationInput = z.infer<typeof applicationSchema>

/** Class the applicant ends up in, whichever route they came through. */
export function classSoughtFor(input: ApplicationInput): string {
  if (input.applicantType === 's1') return 'S1'
  if (input.applicantType === 's5') return 'S5'
  return input.classSought
}

/** Sums the four PLE grades so the form can check the aggregate the applicant chose. */
export function pleAggregateFromGrades(grades: Record<string, string>): number {
  return Object.values(grades).reduce((total, grade) => {
    const numeral = Number(grade.replace(/\D/g, ''))
    return total + (Number.isFinite(numeral) ? numeral : 0)
  }, 0)
}

/** Tracking code shown to the applicant, e.g. AHSN-7Q4K2P. Avoids look-alike characters. */
export function generateTrackingCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  for (const byte of bytes) code += alphabet[byte % alphabet.length]
  return `AHSN-${code}`
}
