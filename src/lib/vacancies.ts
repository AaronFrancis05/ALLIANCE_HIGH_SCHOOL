/**
 * When a vacancy counts as open.
 *
 * The closing date is picked as a day, so the post stays open for the whole of that day
 * in Kampala time (UTC+3, no daylight saving), not just until midnight UTC.
 */

const KAMPALA_OFFSET_MS = 3 * 60 * 60 * 1000

/** The last instant a post closing on this date still accepts applications. */
export function closesAt(closingDate: string): Date {
  const day = closingDate.slice(0, 10) // YYYY-MM-DD, whatever time the picker stored
  const endOfDayUtc = Date.parse(`${day}T23:59:59.999Z`)
  return new Date(endOfDayUtc - KAMPALA_OFFSET_MS)
}

export function isVacancyOpen(vacancy: { closingDate?: string | null }, now: Date = new Date()): boolean {
  if (!vacancy.closingDate) return true
  return now.getTime() <= closesAt(vacancy.closingDate).getTime()
}

/**
 * Earliest instant that still counts as open for a query: a post whose closing date is
 * on or after this has not closed yet.
 */
export function openVacancyCutoff(now: Date = new Date()): string {
  const kampalaToday = new Date(now.getTime() + KAMPALA_OFFSET_MS).toISOString().slice(0, 10)
  return `${kampalaToday}T00:00:00.000Z`
}

export const EMPLOYMENT_LABELS: Record<string, string> = {
  fullTime: 'Full time',
  partTime: 'Part time',
  contract: 'Contract',
}
