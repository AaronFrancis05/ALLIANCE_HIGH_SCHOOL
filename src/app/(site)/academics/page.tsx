/**
 * Academics (FR-01, FR-07, FR-24).
 *
 * Departments and subjects come from the CMS, so adding a subject is an office task.
 */

import React from 'react'
import type { Metadata } from 'next'
import { Container, Card, Section, SectionHeading, ButtonLink, Badge, EmptyState } from '../../../components/ui'
import { MediaImage, PlaceholderNote } from '../../../components/ui/MediaImage'
import { PageHeader } from '../../../components/layout/PageHeader'
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd'
import { getMediaBySlug, getPayloadClient } from '../../../lib/payload'
import { CLASS_LABELS, type SchoolClass } from '../../../access/resources'
import type { Department } from '../../../payload-types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Academics',
  description:
    'O-Level and A-Level teaching at Alliance High School Nansana: departments, subjects and the competence-based curriculum.',
  alternates: { canonical: '/academics' },
}

const LEVELS = [
  {
    id: 'o-level',
    title: 'O-Level — Senior One to Senior Four',
    body: 'The competence-based lower secondary curriculum, ending in the Uganda Certificate of Education. Learners take a broad set of subjects and are assessed continuously as well as at the end.',
  },
  {
    id: 'a-level',
    title: 'A-Level — Senior Five and Senior Six',
    body: 'Two years of specialist study ending in the Uganda Advanced Certificate of Education. Students choose a combination built around the subjects they are strongest in.',
  },
]

export default async function AcademicsPage() {
  const payload = await getPayloadClient()

  const [headerImage, classroomImage, departments, subjects] = await Promise.all([
    getMediaBySlug('students-reading-a-mathematics-textbook-alliance-high-nansana'),
    getMediaBySlug('students-working-through-an-exercise-outdoors-alliance-high-nansana'),
    payload.find({ collection: 'departments', limit: 20, sort: 'name', depth: 2 }),
    payload.find({ collection: 'subjects', limit: 100, sort: 'name', depth: 1 }),
  ])

  const subjectsByDepartment = new Map<string, typeof subjects.docs>()
  for (const subject of subjects.docs) {
    const department = subject.department as Department | number | null | undefined
    const key = typeof department === 'object' && department ? String(department.id) : String(department ?? '')
    const list = subjectsByDepartment.get(key) ?? []
    list.push(subject)
    subjectsByDepartment.set(key, list)
  }

  return (
    <>
      <PageHeader
        title="Academics"
        lead="What we teach, who teaches it, and how learners are assessed."
        image={headerImage}
      />
      <BreadcrumbJsonLd trail={[{ name: 'Academics', href: '/academics' }]} />

      <Section tone="plain">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-8">
              {LEVELS.map((level) => (
                <div key={level.id} id={level.id}>
                  <h2 className="text-2xl sm:text-3xl">{level.title}</h2>
                  <p className="mt-3 text-[var(--text-body)]">{level.body}</p>
                </div>
              ))}

              <div className="rounded-[var(--radius-card)] border border-cream-300 bg-cream-100 p-5">
                <h3 className="font-display text-lg">How learners are followed up</h3>
                <p className="mt-2 text-[var(--text-body)]">
                  Work is marked and returned. Class teachers know which learners are falling behind and
                  speak to parents before a term ends, rather than after results are published.
                </p>
              </div>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
              <MediaImage media={classroomImage} sizes="(max-width: 1024px) 100vw, 40vw" />
              <PlaceholderNote media={classroomImage} />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="sunken" id="departments">
        <Container>
          <SectionHeading
            eyebrow="Departments"
            title="Subjects, by department"
            lead="Each department is led by a head of department who manages its notes and past papers in the e-Library."
          />

          {departments.docs.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {departments.docs.map((department) => {
                const list = subjectsByDepartment.get(String(department.id)) ?? []
                return (
                  <Card key={department.id} className="p-6">
                    <h3 className="font-display text-xl">{department.name}</h3>
                    {department.description ? (
                      <p className="mt-2 text-[var(--text-body)]">{department.description}</p>
                    ) : null}

                    {list.length ? (
                      <ul className="mt-4 space-y-2">
                        {list.map((subject) => (
                          <li key={subject.id} className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-[var(--text-strong)]">
                              {subject.name}
                            </span>
                            <Badge tone="muted">
                              {subject.level === 'both'
                                ? 'O and A-Level'
                                : subject.level === 'o'
                                  ? 'O-Level'
                                  : 'A-Level'}
                            </Badge>
                            {subject.classes?.length ? (
                              <span className="text-xs text-[var(--text-muted)]">
                                {(subject.classes as SchoolClass[])
                                  .map((entry) => CLASS_LABELS[entry] ?? entry)
                                  .join(', ')}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-[var(--text-muted)]">
                        Subjects for this department will be listed here.
                      </p>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="Departments are being set up"
              body="Each department and its subjects will be listed here."
            />
          )}
        </Container>
      </Section>

      <Section tone="plain" id="results">
        <Container>
          <SectionHeading eyebrow="Results" title="UNEB performance" />
          <EmptyState
            title="Results have not been published here yet"
            body="UCE and UACE results for the last three years will be shown here once the school supplies them."
          />
          <div className="mt-8 text-center">
            <ButtonLink href="/resources" variant="secondary">
              Open the e-Library
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
