/**
 * e-Library filters: subject, class, type and year (FR-06).
 *
 * The filters arrive as query-string values, so they are untrusted. Each one is validated
 * on its own and an invalid value is dropped rather than failing the page: a mangled link
 * shows the whole shelf instead of an error.
 *
 * The `Where` built here only narrows. Payload ANDs it with `readResources`, so a filter
 * can never show a visitor anything the access rule hides.
 */

import { z } from 'zod'
import type { Where } from 'payload'
import { SCHOOL_CLASSES, type SchoolClass } from '../access/resources'

export const RESOURCE_TYPES = [
  { label: 'Notes', value: 'notes' },
  { label: 'Past paper', value: 'pastPaper' },
  { label: 'Textbook', value: 'textbook' },
  { label: 'Scheme of work', value: 'scheme' },
  { label: 'Video lesson', value: 'video' },
  { label: 'Other', value: 'other' },
] as const

export type ResourceType = (typeof RESOURCE_TYPES)[number]['value']

const RESOURCE_TYPE_VALUES = RESOURCE_TYPES.map((entry) => entry.value) as [ResourceType, ...ResourceType[]]

export function resourceTypeLabel(value: string): string {
  return RESOURCE_TYPES.find((entry) => entry.value === value)?.label ?? value
}

export interface ResourceFilters {
  subject?: number
  class?: SchoolClass
  type?: ResourceType
  year?: number
}

const fieldSchemas = {
  subject: z.coerce.number().int().positive(),
  class: z.enum(SCHOOL_CLASSES as [SchoolClass, ...SchoolClass[]]),
  type: z.enum(RESOURCE_TYPE_VALUES),
  year: z.coerce.number().int().min(1990).max(2100),
} as const

type SearchParams = Record<string, string | string[] | undefined>

/** The valid filters in a query string. Anything else is ignored. */
export function parseResourceFilters(params: SearchParams): ResourceFilters {
  const filters: Record<string, unknown> = {}

  for (const [name, schema] of Object.entries(fieldSchemas)) {
    const raw = params[name]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (!value) continue

    const parsed = schema.safeParse(value)
    if (parsed.success) filters[name] = parsed.data
  }

  return filters as ResourceFilters
}

export function hasFilters(filters: ResourceFilters): boolean {
  return Object.keys(filters).length > 0
}

/** The database query for these filters, or undefined when there are none. */
export function resourceFiltersWhere(filters: ResourceFilters): Where | undefined {
  const clauses: Where[] = []

  if (filters.subject) clauses.push({ subject: { equals: filters.subject } })
  if (filters.class) clauses.push({ classes: { contains: filters.class } })
  if (filters.type) clauses.push({ type: { equals: filters.type } })
  if (filters.year) clauses.push({ year: { equals: filters.year } })

  return clauses.length ? { and: clauses } : undefined
}
