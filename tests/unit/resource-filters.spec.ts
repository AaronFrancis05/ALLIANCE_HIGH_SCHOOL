/**
 * Proves the e-Library filters accept only valid values and only ever narrow (FR-06).
 */

import { describe, expect, it } from 'vitest'
import {
  hasFilters,
  parseResourceFilters,
  resourceFiltersWhere,
  resourceTypeLabel,
} from '../../src/lib/resource-filters'

describe('parseResourceFilters', () => {
  it('reads every valid filter', () => {
    expect(parseResourceFilters({ subject: '4', class: 'S4', type: 'pastPaper', year: '2024' })).toEqual({
      subject: 4,
      class: 'S4',
      type: 'pastPaper',
      year: 2024,
    })
  })

  it('treats empty values as no filter', () => {
    expect(parseResourceFilters({ subject: '', class: '', type: '', year: '' })).toEqual({})
  })

  it('drops an invalid value and keeps the valid ones', () => {
    expect(parseResourceFilters({ class: 'S9', type: 'notes' })).toEqual({ type: 'notes' })
  })

  it('refuses hostile or malformed input', () => {
    expect(
      parseResourceFilters({
        subject: '1 OR 1=1',
        class: "S4'; DROP TABLE resources; --",
        type: '__proto__',
        year: '99999',
      }),
    ).toEqual({})
  })

  it('refuses a negative or fractional subject id', () => {
    expect(parseResourceFilters({ subject: '-1' })).toEqual({})
    expect(parseResourceFilters({ subject: '2.5' })).toEqual({})
  })

  it('uses the first value when a filter is repeated', () => {
    expect(parseResourceFilters({ class: ['S2', 'S6'] })).toEqual({ class: 'S2' })
  })

  it('ignores parameters it does not know', () => {
    expect(parseResourceFilters({ visibility: 'classes', overrideAccess: 'true' })).toEqual({})
  })
})

describe('resourceFiltersWhere', () => {
  it('adds no clause when there are no filters', () => {
    expect(resourceFiltersWhere({})).toBeUndefined()
  })

  it('combines filters with AND, so each one only narrows', () => {
    expect(resourceFiltersWhere({ class: 'S4', year: 2024 })).toEqual({
      and: [{ classes: { contains: 'S4' } }, { year: { equals: 2024 } }],
    })
  })

  it('never mentions visibility, which only the access rule decides', () => {
    const where = resourceFiltersWhere({ subject: 1, class: 'S1', type: 'notes', year: 2025 })
    expect(JSON.stringify(where)).not.toContain('visibility')
  })
})

describe('helpers', () => {
  it('knows whether any filter is set', () => {
    expect(hasFilters({})).toBe(false)
    expect(hasFilters({ year: 2024 })).toBe(true)
  })

  it('labels a type, falling back to the raw value', () => {
    expect(resourceTypeLabel('pastPaper')).toBe('Past paper')
    expect(resourceTypeLabel('mystery')).toBe('mystery')
  })
})
