'use client'

/**
 * Home page hero.
 *
 * A CSS scroll-snap carousel rather than a JavaScript slider: it costs almost nothing,
 * works without JavaScript, and can be swiped. The headline sits in a panel on the left
 * so it never covers a student's face, and only the first image is given priority so the
 * page still loads quickly on 4G.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MediaImage } from '../ui/MediaImage'
import { cn } from '../../lib/cn'
import type { Media } from '../../payload-types'

export interface HeroSlide {
  headline: string
  subhead?: string | null
  image: Media | number | string
  buttonLabel?: string | null
  buttonHref?: string | null
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const scrollTo = useCallback((next: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = (next + track.children.length) % track.children.length
    track.scrollTo({ left: track.clientWidth * clamped, behavior: 'smooth' })
  }, [])

  // Keep the dots in step when the visitor swipes.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onScroll = () => {
      setIndex(Math.round(track.scrollLeft / track.clientWidth))
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [])

  if (!slides.length) return null

  return (
    <section aria-roledescription="carousel" aria-label="About the school" className="relative bg-ink-950">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, slideIndex) => (
          <article
            key={`${slide.headline}-${slideIndex}`}
            aria-roledescription="slide"
            aria-label={`${slideIndex + 1} of ${slides.length}`}
            className="relative w-full shrink-0 snap-start"
          >
            <div className="relative h-[68vh] max-h-[640px] min-h-[420px] w-full">
              <MediaImage
                media={slide.image}
                priority={slideIndex === 0}
                sizes="100vw"
                className="object-cover"
              />
              {/*
                On a phone the text runs the full width, so the whole picture is darkened
                from the bottom. From `sm` up the panel sits on the left, so only that side
                is darkened and the right of the photograph stays visible. Either way the
                headline keeps well over 4.5:1 against what is behind it.
              */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/70 to-ink-950/40 sm:bg-gradient-to-r sm:from-ink-950/85 sm:via-ink-950/55 sm:to-transparent" />

              <div className="absolute inset-0 flex items-center">
                <div className="container-site">
                  <div className="max-w-xl text-white">
                    {/*
                      Only the first slide carries the page's single h1. The others repeat
                      the same visual style but must not add competing top-level headings
                      for a screen reader or for Google (FR-24).
                    */}
                    {/*
                      `text-white` is explicit: brand.css gives every heading the dark ink
                      colour, which would otherwise win over the white inherited here and
                      leave the headline unreadable against the photograph.
                    */}
                    {slideIndex === 0 ? (
                      <h1 className="font-display text-3xl leading-tight text-white sm:text-5xl">
                        {slide.headline}
                      </h1>
                    ) : (
                      <p className="font-display text-3xl leading-tight text-white sm:text-5xl">
                        {slide.headline}
                      </p>
                    )}
                    {slide.subhead ? (
                      <p className="mt-4 text-base text-cream-200 sm:text-lg">{slide.subhead}</p>
                    ) : null}
                    <div className="mt-7 flex flex-wrap gap-3">
                      {slide.buttonLabel && slide.buttonHref ? (
                        <Link
                          href={slide.buttonHref}
                          className="inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-6 text-sm font-semibold text-ink-950 hover:bg-gold-400"
                        >
                          {slide.buttonLabel}
                        </Link>
                      ) : null}
                      <Link
                        href="/admissions"
                        className="inline-flex min-h-12 items-center rounded-lg border-2 border-white/70 px-6 text-sm font-semibold text-white hover:bg-white hover:text-ink-950"
                      >
                        Admissions
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {slides.length > 1 ? (
        <>
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((slide, dotIndex) => (
              <button
                key={`dot-${slide.headline}-${dotIndex}`}
                type="button"
                onClick={() => scrollTo(dotIndex)}
                aria-label={`Go to slide ${dotIndex + 1}`}
                aria-current={dotIndex === index}
                className={cn(
                  'h-2.5 rounded-full transition-all',
                  dotIndex === index ? 'w-8 bg-gold-500' : 'w-2.5 bg-white/60 hover:bg-white',
                )}
              />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center gap-2 pr-4 sm:flex">
            <button
              type="button"
              onClick={() => scrollTo(index - 1)}
              aria-label="Previous slide"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(index + 1)}
              aria-label="Next slide"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}
