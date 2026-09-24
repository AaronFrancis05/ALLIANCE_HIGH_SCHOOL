/**
 * People from the Staff directory, grouped as the office files them (About sub-pages).
 *
 * Everything shown comes from the CMS, so the office adds, reorders and replaces people
 * without a developer. Two kinds of placeholder are handled:
 *   - a name the school has not confirmed is a bracketed placeholder in the CMS; it is shown
 *     as "Name to be confirmed", never printed with its brackets;
 *   - a person with no photograph gets a silhouette until one is uploaded.
 *
 * On the Leadership page the first person in a group can be featured, which gives the page
 * its hierarchy: the Director, then the Head Teacher, then the rest of the administration.
 */

import React from 'react'
import { Card, EmptyState, InitialsAvatar, isContentPlaceholder } from '../ui'
import { MediaImage, isMedia } from '../ui/MediaImage'
import { cn } from '../../lib/cn'
import type { Department, StaffProfile } from '../../payload-types'

export const STAFF_GROUP_LABELS: Record<StaffProfile['group'], string> = {
  director: 'Director and Founder',
  administration: 'School administration',
  board: 'Board of Governors',
  hods: 'Heads of Department',
  teaching: 'Teaching staff',
  support: 'Support staff',
}

function departmentName(department: StaffProfile['department']): string | null {
  return department && typeof department === 'object' ? (department as Department).name : null
}

function Photo({ person, confirmed, large }: { person: StaffProfile; confirmed: boolean; large: boolean }) {
  const size = large ? 'h-28 w-28 sm:h-32 sm:w-32' : 'h-20 w-20'
  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-[var(--radius-card)]', size)}>
      {isMedia(person.photo) ? (
        <MediaImage
          media={person.photo}
          sizes={large ? '128px' : '80px'}
          alt={confirmed ? `${person.name}, ${person.title} at Alliance High School Nansana` : `${person.title} at Alliance High School Nansana`}
        />
      ) : (
        // A silhouette until the office uploads a photograph.
        <InitialsAvatar name="" className={cn(size, 'text-xl')} />
      )}
    </div>
  )
}

function Person({ person, featured = false }: { person: StaffProfile; featured?: boolean }) {
  const confirmed = !isContentPlaceholder(person.name)
  const department = departmentName(person.department)
  return (
    <Card className={cn('flex items-center gap-4 p-4', featured && 'gap-6 p-6')}>
      <Photo person={person} confirmed={confirmed} large={featured} />
      <div className="min-w-0" data-testid="staff-person">
        {confirmed ? (
          <h3 className={cn('font-display', featured ? 'text-2xl' : 'text-lg')}>{person.name}</h3>
        ) : (
          <h3 className={cn('font-display text-[var(--text-muted)] italic', featured ? 'text-2xl' : 'text-lg')}>
            Name to be confirmed
          </h3>
        )}
        <p className={cn('font-medium text-maroon-700', featured ? 'text-base' : 'text-sm')}>{person.title}</p>
        {department && !person.title.includes(department) ? (
          <p className="text-sm text-[var(--text-muted)]">{department}</p>
        ) : null}
        {person.bio && confirmed ? <p className="mt-2 text-sm text-[var(--text-body)]">{person.bio}</p> : null}
      </div>
    </Card>
  )
}

export interface DirectoryGroup {
  group: StaffProfile['group']
  /** Show the first person on their own, larger: used for the leadership hierarchy. */
  featureFirst?: boolean
  /** List O-Level and A-Level separately: used for heads of subject. */
  splitByLevel?: boolean
}

const LEVELS: { value: StaffProfile['level']; label: string }[] = [
  { value: 'o', label: 'O-Level' },
  { value: 'a', label: 'A-Level' },
]

function PeopleGrid({ people }: { people: StaffProfile[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((person) => (
        <Person key={person.id} person={person} />
      ))}
    </div>
  )
}

export function StaffDirectory({
  people,
  groups,
  emptyBody,
}: {
  people: StaffProfile[]
  groups: DirectoryGroup[]
  emptyBody: string
}) {
  const sections = groups
    .map(({ group, featureFirst, splitByLevel }) => ({
      group,
      featureFirst,
      splitByLevel,
      members: people.filter((person) => person.group === group),
    }))
    .filter((section) => section.members.length > 0)

  if (!sections.length) return <EmptyState title="Being prepared" body={emptyBody} />

  return (
    <div className="space-y-12">
      {sections.map(({ group, featureFirst, splitByLevel, members }) => {
        const [first, ...rest] = members
        const featured = featureFirst ? first : undefined
        const others = featureFirst ? rest : members
        return (
          <section key={group} aria-labelledby={`group-${group}`}>
            <h2 id={`group-${group}`} className="mb-5 text-2xl">
              {STAFF_GROUP_LABELS[group]}
            </h2>
            {featured ? (
              <div className="mb-4 max-w-xl">
                <Person person={featured} featured />
              </div>
            ) : null}
            {others.length && splitByLevel ? (
              <div className="space-y-8">
                {[...LEVELS, { value: null, label: 'Other' }].map((level) => {
                  const atLevel = others.filter((person) =>
                    level.value ? person.level === level.value : !LEVELS.some((known) => known.value === person.level),
                  )
                  if (!atLevel.length) return null
                  return (
                    <div key={level.label}>
                      <h3 className="mb-3 text-sm font-semibold tracking-widest text-maroon-700 uppercase">{level.label}</h3>
                      <PeopleGrid people={atLevel} />
                    </div>
                  )
                })}
              </div>
            ) : others.length ? (
              <PeopleGrid people={others} />
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
