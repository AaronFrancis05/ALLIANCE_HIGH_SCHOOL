/**
 * Loads an e-Library shelf for the public page and the portal alike (FR-06).
 *
 * Both queries run with `overrideAccess: false`, as the given user or as nobody, so
 * `readResources` decides what is on the shelf. The filter options come from that same
 * visible shelf, so a visitor is never offered a subject or year that only exists among
 * items they cannot see.
 */

import type { Payload, Where } from 'payload'
import { HOLIDAY_WORK } from '../access/resources'
import { resourceFiltersWhere, type ResourceFilters } from './resource-filters'
import type { Resource, Student, Subject } from '../payload-types'

const SHELF_LIMIT = 100
const HOLIDAY_WORK_LIMIT = 60

export interface FilterOption {
  value: number
  label: string
}

export interface LibraryShelf {
  resources: Resource[]
  /** Items matching the filters, which may be more than `resources` holds. */
  total: number
  subjects: FilterOption[]
  years: number[]
}

export interface ShelfOptions {
  /**
   * Leave holiday work off the shelf, for a page that shows it in its own section. A
   * visitor who picks "Holiday work" in the type filter still gets it on the shelf.
   */
  separateHolidayWork?: boolean
}

function shelfWhere(filters: ResourceFilters, options: ShelfOptions): Where | undefined {
  const filtered = resourceFiltersWhere(filters)
  if (!options.separateHolidayWork || filters.type) return filtered
  const withoutHolidayWork: Where = { type: { not_equals: HOLIDAY_WORK } }
  return filtered ? { and: [filtered, withoutHolidayWork] } : withoutHolidayWork
}

export async function loadLibraryShelf(
  payload: Payload,
  filters: ResourceFilters,
  user?: Student,
  options: ShelfOptions = {},
): Promise<LibraryShelf> {
  const asRequester = { overrideAccess: false, ...(user ? { user } : {}) } as const

  const [matching, everything] = await Promise.all([
    payload.find({
      collection: 'resources',
      where: shelfWhere(filters, options),
      sort: '-createdAt',
      limit: SHELF_LIMIT,
      depth: 1,
      ...asRequester,
    }),
    payload.find({
      collection: 'resources',
      select: { subject: true, year: true },
      pagination: false,
      depth: 1,
      ...asRequester,
    }),
  ])

  const subjects = new Map<number, string>()
  const years = new Set<number>()

  for (const doc of everything.docs) {
    const subject = doc.subject as Subject | number | undefined
    if (typeof subject === 'object' && subject) subjects.set(subject.id, subject.name)
    if (doc.year) years.add(doc.year)
  }

  return {
    resources: matching.docs,
    total: matching.totalDocs,
    subjects: [...subjects]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    years: [...years].sort((a, b) => b - a),
  }
}

export interface HolidayWorkGroup {
  subject: string
  resources: Resource[]
}

/**
 * The holiday work this student may see, newest first, grouped by subject. Read as the
 * student, like the shelf, so `readResources` decides: their class's work, work for all
 * students, and nothing beyond the public shelf for a suspended student.
 */
export async function loadHolidayWork(payload: Payload, user: Student): Promise<HolidayWorkGroup[]> {
  const found = await payload.find({
    collection: 'resources',
    where: { type: { equals: HOLIDAY_WORK } },
    sort: '-createdAt',
    limit: HOLIDAY_WORK_LIMIT,
    depth: 1,
    overrideAccess: false,
    user,
  })

  const groups = new Map<string, Resource[]>()
  for (const doc of found.docs) {
    const subject = doc.subject as Subject | number | undefined
    const name = typeof subject === 'object' && subject ? subject.name : 'Other subjects'
    groups.set(name, [...(groups.get(name) ?? []), doc])
  }

  return [...groups]
    .map(([subject, resources]) => ({ subject, resources }))
    .sort((a, b) => a.subject.localeCompare(b.subject))
}
