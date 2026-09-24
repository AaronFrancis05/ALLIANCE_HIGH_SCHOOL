/**
 * An iCalendar (.ics) file for one school event, so a parent can add it to a phone
 * calendar (FR-20). Written to RFC 5545: CRLF line endings, text escaped, long lines
 * folded at 75 octets, times in UTC.
 *
 * An event with no end time is given none: the standard allows it, and making one up would
 * put a guess in parents' calendars.
 */

export interface CalendarEvent {
  /** Stable across downloads, so a second download updates the entry instead of copying it. */
  uid: string
  title: string
  description?: string | null
  location?: string | null
  url?: string | null
  start: string
  end?: string | null
  /** When the file was made; defaults to now. */
  stamp?: Date
}

/** 20270115T090000Z */
function utc(value: string | Date): string {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Backslash, semicolon, comma and newline must be escaped in TEXT values. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Folds a content line so no physical line is longer than 75 octets. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  let size = 0
  for (const character of line) {
    const bytes = encoder.encode(character).length
    // Continuation lines start with a space, which counts towards their 75.
    const limit = parts.length === 0 ? 75 : 74
    if (size + bytes > limit) {
      parts.push(current)
      current = ''
      size = 0
    }
    current += character
    size += bytes
  }
  parts.push(current)
  return parts.join('\r\n ')
}

export function buildEventIcs(event: CalendarEvent): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alliance High School Nansana//Website//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${utc(event.stamp ?? new Date())}`,
    `DTSTART:${utc(event.start)}`,
    event.end ? `DTEND:${utc(event.end)}` : null,
    `SUMMARY:${escapeText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeText(event.description)}` : null,
    event.location ? `LOCATION:${escapeText(event.location)}` : null,
    event.url ? `URL:${event.url}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines
    .filter((line): line is string => line !== null)
    .map(foldLine)
    .join('\r\n')
    .concat('\r\n')
}
