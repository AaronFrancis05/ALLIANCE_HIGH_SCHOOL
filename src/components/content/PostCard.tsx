/**
 * News card: picture, date, category tag and a title that is never cut off mid-word
 * (the truncated titles on the Greenhill site are what this avoids).
 */

import React from 'react'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { Badge } from '../ui'
import { MediaImage, PlaceholderNote } from '../ui/MediaImage'
import type { Category, Post } from '../../payload-types'

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Kampala',
  }).format(new Date(value))
}

export function PostCard({ post }: { post: Post }) {
  const category = typeof post.category === 'object' ? (post.category as Category) : null

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]">
      <Link href={`/news/${post.slug}`} className="relative block aspect-16/9 w-full overflow-hidden">
        <MediaImage
          media={post.coverImage}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <PlaceholderNote media={post.coverImage} />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {category ? <Badge tone={(category.colour as 'maroon' | 'gold' | 'ink') ?? 'maroon'}>{category.name}</Badge> : null}
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </span>
        </div>

        <h3 className="font-display text-lg leading-snug">
          <Link href={`/news/${post.slug}`} className="hover:text-maroon-700">
            {post.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
          {post.excerpt}
        </p>

        <Link
          href={`/news/${post.slug}`}
          className="mt-4 self-start text-sm font-medium text-maroon-700 hover:text-maroon-900"
        >
          Read more
          <span className="sr-only">: {post.title}</span>
          <span aria-hidden> &rarr;</span>
        </Link>
      </div>
    </article>
  )
}
