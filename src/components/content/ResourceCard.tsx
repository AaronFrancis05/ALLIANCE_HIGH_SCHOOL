/**
 * One e-Library item: what it is, who it is for and how big it is, so a student knows what
 * they are downloading before they spend data (FR-09).
 *
 * The download goes to `/api/files/resource/<id>`, which re-checks access and hands out a
 * five-minute signed URL (FR-08). It is a plain anchor, not a Next.js Link, so nothing
 * prefetches the route and counts a download nobody asked for.
 */

import React from 'react'
import Link from 'next/link'
import { BookOpen, Download, FileText, GraduationCap, Layers, Video } from 'lucide-react'
import { Badge, Card } from '../ui'
import { CLASS_LABELS, type SchoolClass } from '../../access/resources'
import { resourceTypeLabel } from '../../lib/resource-filters'
import type { Resource, Subject } from '../../payload-types'

const TYPE_ICONS: Record<string, typeof BookOpen> = {
  notes: FileText,
  pastPaper: GraduationCap,
  textbook: BookOpen,
  scheme: Layers,
  video: Video,
  other: FileText,
}

const ACTION_CLASS =
  'inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-maroon-700 hover:text-maroon-900'

export function formatSize(bytes?: number | null): string | null {
  if (!bytes) return null
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export function resourceDownloadHref(id: Resource['id']): string {
  return `/api/files/resource/${id}`
}

export function ResourceCard({ resource }: { resource: Resource }) {
  const Icon = TYPE_ICONS[resource.type] ?? FileText
  const subject = resource.subject as Subject | undefined
  const size = formatSize(resource.filesize)

  return (
    <Card as="li" className="flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-7 w-7 shrink-0 text-maroon-700" aria-hidden />
        <Badge tone="muted">{resourceTypeLabel(resource.type)}</Badge>
      </div>

      <h2 className="mt-4 font-display text-lg">{resource.title}</h2>
      {resource.description ? (
        <p className="mt-2 line-clamp-3 text-sm text-[var(--text-body)]">{resource.description}</p>
      ) : null}

      <dl className="mt-4 space-y-1 text-xs text-[var(--text-muted)]">
        {typeof subject === 'object' && subject?.name ? (
          <div className="flex gap-1">
            <dt className="font-medium">Subject:</dt>
            <dd>{subject.name}</dd>
          </div>
        ) : null}
        {resource.classes?.length ? (
          <div className="flex gap-1">
            <dt className="font-medium">For:</dt>
            <dd>
              {(resource.classes as SchoolClass[]).map((entry) => CLASS_LABELS[entry] ?? entry).join(', ')}
            </dd>
          </div>
        ) : null}
        {resource.year ? (
          <div className="flex gap-1">
            <dt className="font-medium">Year:</dt>
            <dd>{resource.year}</dd>
          </div>
        ) : null}
        {size ? (
          <div className="flex gap-1">
            <dt className="font-medium">Size:</dt>
            <dd>{size}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto pt-5">
        {resource.externalUrl ? (
          <Link href={resource.externalUrl} target="_blank" rel="noreferrer" className={ACTION_CLASS}>
            Open the link →<span className="sr-only">: {resource.title}</span>
          </Link>
        ) : resource.filename ? (
          <a href={resourceDownloadHref(resource.id)} rel="nofollow" className={ACTION_CLASS}>
            <Download className="h-4 w-4" aria-hidden />
            Download{size ? ` (${size})` : ''}
            <span className="sr-only">: {resource.title}</span>
          </a>
        ) : null}
      </div>
    </Card>
  )
}
