/**
 * The stages an application moves through (FR-18, FR-19), and how each is explained to a
 * family: on the tracking page and in the notification sent when the stage changes.
 *
 * One source for the wording, so the page and the message can never say different things.
 */

export const APPLICATION_STATUSES = [
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under review', value: 'review' },
  { label: 'Interview or entrance test', value: 'interview' },
  { label: 'Admitted', value: 'admitted' },
  { label: 'Waitlisted', value: 'waitlisted' },
  { label: 'Not successful', value: 'rejected' },
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]['value']

export interface StatusForFamily {
  /** Short heading, e.g. "Under review". */
  title: string
  /** One or two sentences a parent can act on. */
  explanation: string
  /** Final outcomes are shown differently from stages still in progress. */
  final: boolean
}

export const STATUS_FOR_FAMILY: Record<ApplicationStatus, StatusForFamily> = {
  submitted: {
    title: 'Received',
    explanation: 'The admissions office has received the application and will review it soon.',
    final: false,
  },
  review: {
    title: 'Under review',
    explanation: 'The admissions office is reviewing the application.',
    final: false,
  },
  interview: {
    title: 'Interview or entrance test',
    explanation:
      'The student is invited for an interview or entrance test. The admissions office will contact you with the details.',
    final: false,
  },
  admitted: {
    title: 'Offered a place',
    explanation: 'The student has been offered a place. The admissions office will contact you about joining.',
    final: true,
  },
  waitlisted: {
    title: 'On the waiting list',
    explanation: 'The student is on the waiting list. The admissions office will contact you if a place becomes available.',
    final: false,
  },
  rejected: {
    title: 'Not successful',
    explanation:
      'The application was not successful this time. You are welcome to contact the admissions office with any questions.',
    final: true,
  },
}

export function statusForFamily(status: string): StatusForFamily {
  return STATUS_FOR_FAMILY[status as ApplicationStatus] ?? STATUS_FOR_FAMILY.submitted
}
