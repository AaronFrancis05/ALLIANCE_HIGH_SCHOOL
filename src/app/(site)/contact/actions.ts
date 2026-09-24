'use server'

/**
 * Enquiry submission (FR-21, A04).
 *
 * Rules enforced here:
 *   - the same parser and schema the browser uses, checked again on the server;
 *   - a hidden honeypot field turns bots away, and submissions are rate-limited per client;
 *   - the public cannot create enquiries through the API (create is denied), so this writes
 *     with overrideAccess after its own checks;
 *   - the office is emailed a copy; a failed email never loses the saved enquiry;
 *   - no personal data goes into a log line or an error message (NFR-05).
 */

import { headers } from 'next/headers'
import { getPayloadClient } from '../../../lib/payload'
import { checkRateLimit, clientIdentifier } from '../../../lib/rate-limit'
import { logger } from '../../../lib/logger'
import { createNotifier } from '../../../lib/notify'
import { ENQUIRY_TOPICS, parseEnquiryForm, type EnquiryErrors, type EnquiryInput } from '../../../lib/enquiry-schema'

export type EnquiryState =
  | { status: 'idle' }
  | { status: 'error'; message: string; errors?: EnquiryErrors; values?: Record<string, string> }
  | { status: 'sent' }

const UNAVAILABLE =
  'Your message could not be sent just now. Please try again in a few minutes, or call the school office.'

function postedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  for (const [name, value] of formData.entries()) {
    if (typeof value === 'string' && name !== 'website' && !name.startsWith('$')) values[name] = value
  }
  return values
}

function officeEmail(enquiry: EnquiryInput, office: string) {
  const topic = ENQUIRY_TOPICS.find((entry) => entry.value === enquiry.form)?.label ?? enquiry.form
  const lines = [
    `A message was sent through the website: ${topic}.`,
    '',
    `Name: ${enquiry.name}`,
    enquiry.email ? `Email: ${enquiry.email}` : null,
    enquiry.phone ? `Telephone: ${enquiry.phone}` : null,
    enquiry.form === 'alumni' ? `Year finished: ${enquiry.yearOfCompletion}` : null,
    enquiry.form === 'alumni' && enquiry.occupation ? `Occupation: ${enquiry.occupation}` : null,
    enquiry.form === 'careers' ? `Post asked about: ${enquiry.position}` : null,
    enquiry.subject ? `Subject: ${enquiry.subject}` : null,
    '',
    enquiry.message,
    '',
    'It is also saved under Enquiries in the admin panel. Tick "handled" once you have replied.',
  ]
  return {
    to: office,
    subject: `Website enquiry: ${enquiry.subject || topic}`,
    text: lines.filter((line) => line !== null).join('\n'),
  }
}

export async function sendEnquiryAction(_previous: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const values = postedValues(formData)

  // Real visitors never see this field, so anything in it came from a bot.
  if (formData.get('website')) {
    logger.warn('Enquiry honeypot filled; submission dropped')
    return { status: 'error', message: UNAVAILABLE, values }
  }

  const requestHeaders = await headers()
  const rate = checkRateLimit('contactForm', clientIdentifier(new Request('http://contact', { headers: requestHeaders })))
  if (!rate.allowed) {
    return {
      status: 'error',
      message: `Too many messages have been sent from this connection. Please wait ${Math.ceil(rate.retryAfter / 60)} minutes and try again.`,
      values,
    }
  }

  const parsed = parseEnquiryForm(formData)
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Some answers need attention. Please check the highlighted questions.',
      errors: parsed.errors,
      values,
    }
  }
  const enquiry = parsed.data

  const payload = await getPayloadClient()
  try {
    await payload.create({
      collection: 'formSubmissions',
      data: {
        form: enquiry.form,
        name: enquiry.name,
        email: enquiry.email || null,
        phone: enquiry.phone || null,
        subject: enquiry.subject || null,
        message: enquiry.message,
        meta: {
          yearOfCompletion: enquiry.form === 'alumni' ? enquiry.yearOfCompletion : null,
          occupation: enquiry.form === 'alumni' ? enquiry.occupation || null : null,
          position: enquiry.form === 'careers' ? enquiry.position : null,
        },
      },
      // Public create is denied on the collection; every check has been made above.
      overrideAccess: true,
    })
  } catch (error) {
    logger.error('Enquiry could not be saved', { reason: error instanceof Error ? error.name : 'unknown' })
    return { status: 'error', message: UNAVAILABLE, values }
  }

  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 })
  const office = settings.emails?.[0]?.address
  if (office) await createNotifier(payload).sendEmail(officeEmail(enquiry, office))
  else logger.warn('Enquiry saved, but no office email address is set in School details')

  return { status: 'sent' }
}
