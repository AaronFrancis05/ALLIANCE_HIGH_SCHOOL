/**
 * The banner every inner page opens with: a photograph, the page title and a breadcrumb.
 *
 * The photograph is optional. Without one the header falls back to the brand colour, so a
 * page is never blocked on the school supplying a picture.
 */

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Container } from '../ui'
import { MediaImage, PlaceholderNote, isMedia } from '../ui/MediaImage'
import type { Media } from '../../payload-types'

export interface Crumb {
  name: string
  href: string
}

interface PageHeaderProps {
  title: string
  lead?: string | null
  image?: Media | number | string | null
  /** Everything except the current page, which is added from `title`. */
  trail?: Crumb[]
}

export function PageHeader({ title, lead, image, trail = [] }: PageHeaderProps) {
  const hasImage = isMedia(image)

  return (
    <section className="relative isolate bg-maroon-800">
      {hasImage ? (
        <>
          <div className="absolute inset-0 -z-10">
            <MediaImage media={image} priority sizes="100vw" alt="" />
          </div>
          {/* Dark enough for white text at 4.5:1 wherever the photograph is light. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950/90 via-ink-950/75 to-ink-950/55" />
        </>
      ) : null}

      <Container className="py-12 sm:py-16">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-cream-200">
            <li>
              <Link href="/" className="hover:text-gold-300">
                Home
              </Link>
            </li>
            {trail.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />
                <Link href={crumb.href} className="hover:text-gold-300">
                  {crumb.name}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-1" aria-current="page">
              <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />
              <span className="text-gold-300">{title}</span>
            </li>
          </ol>
        </nav>

        <h1 className="mt-4 font-display text-3xl leading-tight text-white sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-4 max-w-2xl text-base text-cream-200 sm:text-lg">{lead}</p> : null}
      </Container>

      {hasImage ? <PlaceholderNote media={image} /> : null}
    </section>
  )
}
