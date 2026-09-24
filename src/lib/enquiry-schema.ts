/**
 * The enquiry form (FR-21): a general question, a visit request, an alumni registration or
 * a question about working at the school. One schema, run by the browser and the server.
 *
 * Spam protection here: a hidden honeypot field and a cap on links, which is where most
 * contact-form spam gives itself away. The server adds a rate limit.
 */

import { z } from 'zod'

export const ENQUIRY_TOPICS = [
  { value: 'contact', label: 'A general question' },
  { value: 'visit', label: 'Arrange a visit to the school' },
  { value: 'alumni', label: 'Register as a former student' },
  { value: 'careers', label: 'Ask about working at the school' },
] as const

export type EnquiryTopic = (typeof ENQUIRY_TOPICS)[number]['value']

/** More links than this in a message is almost always spam. */
export const MAX_LINKS = 2

function countLinks(text: string): number {
  return (text.match(/https?:\/\/|www\./gi) ?? []).length
}

const base = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80, 'That name is too long'),
  email: z.string().trim().email('Enter a valid email address').or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^([+\d][\d\s-]{8,17})?$/, 'Enter a valid telephone number, for example 0702 601686'),
  subject: z.string().trim().max(120, 'Please keep the subject short'),
  message: z
    .string()
    .trim()
    .min(10, 'Please write a little more, so the office can help')
    .max(2000, 'Please keep the message under 2,000 characters')
    .refine((text) => countLinks(text) <= MAX_LINKS, `Please include no more than ${MAX_LINKS} links`),
  /** Must stay empty: filled in only by bots. */
  website: z.literal(''),
})

const needsAWayToReply = (data: { email: string; phone: string }) => Boolean(data.email || data.phone)
const REPLY_MESSAGE = { message: 'Give an email address or a telephone number so the office can reply', path: ['email'] }

export const enquirySchema = z
  .discriminatedUnion('form', [
    base.extend({ form: z.literal('contact') }),
    base.extend({ form: z.literal('visit') }),
    base.extend({
      form: z.literal('alumni'),
      yearOfCompletion: z.string().trim().regex(/^(19|20)\d{2}$/, 'Enter the year you finished, for example 2015'),
      occupation: z.string().trim().max(80, 'Please keep this short'),
    }),
    base.extend({
      form: z.literal('careers'),
      position: z.string().trim().min(2, 'Say which kind of post you are asking about').max(80),
    }),
  ])
  .refine(needsAWayToReply, REPLY_MESSAGE)

export type EnquiryInput = z.infer<typeof enquirySchema>

type FormEntries = Pick<FormData, 'get'>

function text(form: FormEntries, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

/** Reads the posted form; only the fields for the chosen topic are read. */
export function readEnquiryForm(form: FormEntries): Record<string, unknown> {
  const topic = text(form, 'form')
  const fields: Record<string, unknown> = {
    form: topic,
    name: text(form, 'name'),
    email: text(form, 'email'),
    phone: text(form, 'phone'),
    subject: text(form, 'subject'),
    message: text(form, 'message'),
    website: text(form, 'website'),
  }
  if (topic === 'alumni') {
    fields.yearOfCompletion = text(form, 'yearOfCompletion')
    fields.occupation = text(form, 'occupation')
  }
  if (topic === 'careers') fields.position = text(form, 'position')
  return fields
}

export type EnquiryErrors = Record<string, string>

export function parseEnquiryForm(
  form: FormEntries,
): { success: true; data: EnquiryInput } | { success: false; errors: EnquiryErrors } {
  const result = enquirySchema.safeParse(readEnquiryForm(form))
  if (result.success) return { success: true, data: result.data }

  const errors: EnquiryErrors = {}
  for (const issue of result.error.issues) errors[issue.path.join('.') || 'form'] ??= issue.message
  if (errors.form) errors.form = 'Choose what your message is about'
  return { success: false, errors }
}
