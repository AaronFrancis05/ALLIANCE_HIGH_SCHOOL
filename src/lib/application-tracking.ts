/**
 * Looking up an application's progress (FR-18).
 *
 * A family proves it is theirs with two things only they should have: the reference from
 * the confirmation screen and the guardian's telephone number from the form. Both must
 * match; a wrong reference and a wrong number get the same answer, so references cannot
 * be probed one half at a time.
 */

import { z } from 'zod'
import { normaliseUgandanPhone } from './notify'

/** Matches the codes `generateTrackingCode` issues, whatever case the family types. */
export const trackingLookupSchema = z.object({
  trackingCode: z
    .string()
    .trim()
    .toUpperCase()
    .transform((code) => (code.startsWith('AHSN-') ? code : `AHSN-${code.replace(/^AHSN/, '')}`))
    .pipe(z.string().regex(/^AHSN-[A-Z0-9]{6}$/, 'Enter the reference, for example AHSN-7Q4K2P')),
  guardianPhone: z.string().trim().min(9, 'Enter the telephone number given on the form').max(20),
})

export type TrackingLookup = z.infer<typeof trackingLookupSchema>

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/** True when two ways of writing a number name the same phone: 0772…, +256 772…, 256772…. */
export function samePhone(a: string, b: string): boolean {
  const left = normaliseUgandanPhone(a)
  const right = normaliseUgandanPhone(b)
  if (left && right) return left === right
  // A number from outside Uganda: compare the digits as written.
  const leftDigits = digitsOnly(a)
  return leftDigits.length >= 9 && leftDigits === digitsOnly(b)
}

/** What the tracking page shows. Deliberately no names: the page may be open on a shared phone. */
export interface TrackingResult {
  trackingCode: string
  status: string
  classSought: string
  submittedOn: string
  interviewDate: string | null
}
