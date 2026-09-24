/**
 * The e-Library filter bar (FR-06).
 *
 * A plain GET form: it works with no JavaScript on the cheapest phone, the filtered view
 * is a link a teacher can share, and the server does the filtering in the database.
 */

import React from 'react'
import Link from 'next/link'
import { CLASS_LABELS, SCHOOL_CLASSES } from '../../access/resources'
import { RESOURCE_TYPES, hasFilters, type ResourceFilters as Filters } from '../../lib/resource-filters'
import type { FilterOption } from '../../lib/library'

const SELECT_CLASS =
  'mt-1.5 min-h-12 w-full rounded-lg border border-cream-300 bg-white px-3 text-base text-ink-900 focus:border-maroon-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-600'

const LABEL_CLASS = 'block text-sm font-medium text-[var(--text-strong)]'

interface Props {
  /** The page the form submits to, e.g. `/resources`. */
  action: string
  filters: Filters
  subjects: FilterOption[]
  years: number[]
  total: number
}

export function ResourceFilters({ action, filters, subjects, years, total }: Props) {
  const active = hasFilters(filters)

  return (
    <form
      method="get"
      action={action}
      role="search"
      aria-label="Filter the e-Library"
      className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 sm:p-5"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <label htmlFor="filter-subject" className={LABEL_CLASS}>
            Subject
          </label>
          <select id="filter-subject" name="subject" defaultValue={filters.subject ?? ''} className={SELECT_CLASS}>
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-class" className={LABEL_CLASS}>
            Class
          </label>
          <select id="filter-class" name="class" defaultValue={filters.class ?? ''} className={SELECT_CLASS}>
            <option value="">All classes</option>
            {SCHOOL_CLASSES.map((value) => (
              <option key={value} value={value}>
                {CLASS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-type" className={LABEL_CLASS}>
            Type
          </label>
          <select id="filter-type" name="type" defaultValue={filters.type ?? ''} className={SELECT_CLASS}>
            <option value="">All types</option>
            {RESOURCE_TYPES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-year" className={LABEL_CLASS}>
            Year
          </label>
          <select id="filter-year" name="year" defaultValue={filters.year ?? ''} className={SELECT_CLASS}>
            <option value="">All years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-maroon-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-maroon-800"
        >
          Show resources
        </button>
        {active ? (
          <Link
            href={action}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-maroon-700 hover:text-maroon-900"
          >
            Clear filters
          </Link>
        ) : null}
        <p className="text-sm text-[var(--text-muted)]" role="status">
          {total === 1 ? '1 resource' : `${total} resources`}
          {active ? (total === 1 ? ' matches' : ' match') : ''}
        </p>
      </div>
    </form>
  )
}
