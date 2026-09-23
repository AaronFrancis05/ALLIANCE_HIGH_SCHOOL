/**
 * One image component for everything that comes out of the CMS.
 *
 * It always knows its dimensions and always has a blurred placeholder, so pages never
 * jump or flash an empty grey box while loading (the flaw on the reference site).
 */

import React from 'react'
import Image from 'next/image'
import { cn } from '../../lib/cn'
import type { Media } from '../../payload-types'

type MediaLike = number | string | Media | null | undefined

export function isMedia(value: MediaLike): value is Media {
  return Boolean(value && typeof value === 'object' && 'url' in value)
}

export interface MediaImageProps {
  media: MediaLike
  className?: string
  /** Matches the CSS width of the slot, so the browser downloads the right size. */
  sizes?: string
  priority?: boolean
  /** Fills its positioned parent instead of laying out at its natural size. */
  fill?: boolean
  width?: number
  height?: number
  /** Overrides the alt text from the CMS. Use '' only for purely decorative images. */
  alt?: string
}

export function MediaImage({
  media,
  className,
  sizes = '100vw',
  priority = false,
  fill = true,
  width,
  height,
  alt,
}: MediaImageProps) {
  if (!isMedia(media) || !media.url) {
    return <div className={cn('bg-cream-200', className)} aria-hidden="true" />
  }

  const blur = media.blurDataUrl ?? undefined

  return (
    <Image
      src={media.url}
      alt={alt ?? media.alt ?? ''}
      {...(fill
        ? { fill: true }
        : { width: width ?? media.width ?? 1200, height: height ?? media.height ?? 800 })}
      sizes={sizes}
      priority={priority}
      placeholder={blur ? 'blur' : 'empty'}
      blurDataURL={blur}
      className={cn('object-cover', className)}
    />
  )
}

/**
 * Marks an AI stand-in while the school is still collecting its own photographs.
 *
 * It is deliberately visible to everyone: an invented picture must never be passed off as
 * a photograph of a real event at the school (AGENTS.md section 6). Once every placeholder
 * has been replaced, no image carries `isPlaceholder` and the badge disappears by itself.
 */
export function PlaceholderNote({ media }: { media: MediaLike }) {
  if (!isMedia(media) || !media.isPlaceholder) return null

  return (
    <span className="pointer-events-none absolute top-2 left-2 rounded bg-ink-950/75 px-2 py-1 text-[10px] font-medium tracking-wide text-gold-300 uppercase">
      Placeholder image
    </span>
  )
}
