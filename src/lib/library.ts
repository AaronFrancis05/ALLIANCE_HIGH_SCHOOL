/**
 * Loads an e-Library shelf for the public page and the portal alike (FR-06).
 *
 * Both queries run with `overrideAccess: false`, as the given user or as nobody, so
 * `readResources` decides what is on the shelf. The filter options come from that same
 * visible shelf, so a visitor is never offered a subject or year that only exists among
 * items they cannot see.
 */

import type { Payload } from 'payload'
import { resourceFiltersWhere, type ResourceFilters } from './resource-filters'
import type { Resource, Student, Subject } from '../payload-types'

const SHELF_LIMIT = 100

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

export async function loadLibraryShelf(
  payload: Payload,
  filters: ResourceFilters,
  user?: Student,
): Promise<LibraryShelf> {
  const asRequester = { overrideAccess: false, ...(user ? { user } : {}) } as const

  const [matching, everything] = await Promise.all([
    payload.find({
      collection: 'resources',
      where: resourceFiltersWhere(filters),
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
