/**
 * Calendar files for events (FR-20), checked against the parts of RFC 5545 phones enforce.
 */

import { describe, expect, it } from 'vitest'
import { buildEventIcs, escapeText, foldLine } from '../../src/lib/ics'

const event = {
  uid: 'event-7@example.test',
  title: 'Visiting day',
  description: 'Parents, bring the fees card.',
  location: 'Main hall, Alliance High School Nansana',
  url: 'https://example.test/events/visiting-day',
  start: '2027-03-06T07:00:00.000Z',
  end: '2027-03-06T12:00:00.000Z',
  stamp: new Date('2026-09-23T10:00:00.000Z'),
}

describe('buildEventIcs', () => {
  it('writes one event with UTC times and CRLF line endings', () => {
    const ics = buildEventIcs(event)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('\r\nDTSTART:20270306T070000Z\r\n')
    expect(ics).toContain('\r\nDTEND:20270306T120000Z\r\n')
    expect(ics).toContain('\r\nUID:event-7@example.test\r\n')
    expect(ics.split('\r\n').filter((line) => line === 'BEGIN:VEVENT')).toHaveLength(1)
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n')
  })

  it('leaves out the end rather than inventing one', () => {
    expect(buildEventIcs({ ...event, end: null })).not.toContain('DTEND')
  })

  it('escapes the characters that would break the file', () => {
    expect(buildEventIcs(event)).toContain('LOCATION:Main hall\\, Alliance High School Nansana')
    expect(escapeText('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne')
  })
})

describe('foldLine', () => {
  it('keeps every physical line within 75 octets, even with multi-byte characters', () => {
    const long = `SUMMARY:${'Ekitongole ky’abazadde – '.repeat(10)}`
    const folded = foldLine(long)
    for (const line of folded.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    // Unfolding gives back the original line.
    expect(folded.replace(/\r\n /g, '')).toBe(long)
  })
})
