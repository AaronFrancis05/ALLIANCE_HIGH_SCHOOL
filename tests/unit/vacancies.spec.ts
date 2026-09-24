/**
 * When a vacancy stops being open. The closing date is a whole day in Kampala (UTC+3).
 */

import { describe, expect, it } from 'vitest'
import { closesAt, isVacancyOpen, openVacancyCutoff } from '../../src/lib/vacancies'

// Payload stores a day picked in the admin as noon UTC.
const closing = { closingDate: '2026-10-01T12:00:00.000Z' }

describe('isVacancyOpen', () => {
  it('treats a post with no closing date as open', () => {
    expect(isVacancyOpen({ closingDate: null }, new Date('2030-01-01T00:00:00Z'))).toBe(true)
    expect(isVacancyOpen({}, new Date('2030-01-01T00:00:00Z'))).toBe(true)
  })

  it('keeps the post open to the end of the closing day in Kampala', () => {
    expect(closesAt(closing.closingDate).toISOString()).toBe('2026-10-01T20:59:59.999Z')
    expect(isVacancyOpen(closing, new Date('2026-10-01T20:59:59.000Z'))).toBe(true) // 23:59:59 in Kampala
    expect(isVacancyOpen(closing, new Date('2026-10-01T21:00:00.000Z'))).toBe(false) // midnight in Kampala
  })
})

describe('openVacancyCutoff', () => {
  it('is the start of the current Kampala day', () => {
    expect(openVacancyCutoff(new Date('2026-10-01T20:59:00.000Z'))).toBe('2026-10-01T00:00:00.000Z')
    expect(openVacancyCutoff(new Date('2026-10-01T21:00:00.000Z'))).toBe('2026-10-02T00:00:00.000Z')
  })

  it('agrees with isVacancyOpen for a noon-stored closing date', () => {
    for (const now of ['2026-10-01T20:59:00.000Z', '2026-10-01T21:00:00.000Z', '2026-09-30T08:00:00.000Z']) {
      const listed = closing.closingDate >= openVacancyCutoff(new Date(now))
      expect(listed).toBe(isVacancyOpen(closing, new Date(now)))
    }
  })
})
