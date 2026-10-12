'use client'

/**
 * Home page hero.
 *
 * A CSS scroll-snap carousel rather than a JavaScript slider: it costs almost nothing,
 * works without JavaScript, and can be swiped. The headline sits in a panel on the left
 * so it never covers a student's face, and only the first image is given priority so the
 * page still loads quickly on 4G.
 *
 * Slides advance on their own every `INTERVAL_MS`. The timer is the active dot's progress
 * bar: when its CSS animation ends, the next slide is shown. Pausing the animation pauses
 * the carousel, so the two never drift apart, and a visitor who asks for reduced motion
 * gets no animation and therefore no autoplay. Hovering, hiding the tab or pressing the
 * pause button all hold the current slide (WCAG 2.2.2).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
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

const INTERVAL_MS = 7000
/** Quiet time after the last scroll event before the track counts as at rest. */
const SETTLE_MS = 120

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [hidden, setHidden] = useState(false)

  const paused = stopped || hovered || hidden

  const scrollTo = useCallback((next: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = (next + track.children.length) % track.children.length
    track.scrollTo({ left: track.clientWidth * clamped, behavior: 'smooth' })
  }, [])

  /*
   * Keep the dots in step when the visitor swipes. The active slide only changes once the
   * track has come to rest, so the outgoing photograph keeps its zoom until it is off
   * screen and the incoming copy fades up after the slide lands. A short debounce stands
   * in for `scrollend`, which older Safari lacks.
   */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let settle: ReturnType<typeof setTimeout> | undefined

    const onScroll = () => {
      clearTimeout(settle)
      settle = setTimeout(() => setIndex(Math.round(track.scrollLeft / track.clientWidth)), SETTLE_MS)
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(settle)
      track.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Hold the slide while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  if (!slides.length) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label="About the school"
      className="relative bg-ink-950"
      style={{ '--hero-interval': `${INTERVAL_MS}ms` } as React.CSSProperties}
      // Mouse only: a tap on a phone fires an enter with no matching leave.
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(event) => event.pointerType === 'mouse' && setHovered(false)}
    >
      <div
        ref={trackRef}
        aria-live={paused ? 'polite' : 'off'}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, slideIndex) => (
          <article
            key={`${slide.headline}-${slideIndex}`}
            aria-roledescription="slide"
            aria-label={`${slideIndex + 1} of ${slides.length}`}
            data-active={slideIndex === index ? '' : undefined}
            className="hero-slide relative w-full shrink-0 snap-start"
          >
            <div className="relative h-[68vh] max-h-[640px] min-h-[420px] w-full overflow-hidden">
              {/* The active photograph pushes in slowly for as long as it is shown. */}
              <div className="hero-photo absolute inset-0">
                <MediaImage
                  media={slide.image}
                  priority={slideIndex === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
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
                      <h1 className="hero-copy font-display text-3xl leading-tight text-white sm:text-5xl">
                        {slide.headline}
                      </h1>
                    ) : (
                      <p className="hero-copy font-display text-3xl leading-tight text-white sm:text-5xl">
                        {slide.headline}
                      </p>
                    )}
                    {slide.subhead ? (
                      <p
                        className="hero-copy mt-4 text-base text-cream-200 sm:text-lg"
                        style={{ '--motion-delay': '120ms' } as React.CSSProperties}
                      >
                        {slide.subhead}
                      </p>
                    ) : null}
                    <div
                      className="hero-copy mt-7 flex flex-wrap gap-3"
                      style={{ '--motion-delay': '240ms' } as React.CSSProperties}
                    >
                      {slide.buttonLabel && slide.buttonHref ? (
                        <Link
                          href={slide.buttonHref}
                          className="motion-press inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-6 text-sm font-semibold text-ink-950 hover:bg-gold-400"
                        >
                          {slide.buttonLabel}
                        </Link>
                      ) : null}
                      <Link
                        href="/admissions"
                        className="motion-press inline-flex min-h-12 items-center rounded-lg border-2 border-white/70 px-6 text-sm font-semibold text-white hover:bg-white hover:text-ink-950"
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
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {slides.map((slide, dotIndex) => (
              <button
                key={`dot-${slide.headline}-${dotIndex}`}
                type="button"
                onClick={() => scrollTo(dotIndex)}
                aria-label={`Go to slide ${dotIndex + 1}`}
                aria-current={dotIndex === index}
                className={cn(
                  'relative h-2.5 overflow-hidden rounded-full transition-[width,background-color] duration-300',
                  dotIndex === index ? 'w-8 bg-white/40' : 'w-2.5 bg-white/60 hover:bg-white',
                )}
              >
                {dotIndex === index ? (
                  <span
                    key={`progress-${index}`}
                    aria-hidden
                    data-paused={paused ? '' : undefined}
                    onAnimationEnd={() => scrollTo(index + 1)}
                    className="hero-progress absolute inset-0 rounded-full bg-gold-500"
                  />
                ) : null}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setStopped((value) => !value)}
              aria-label={stopped ? 'Play slideshow' : 'Pause slideshow'}
              className="ml-1 flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-white"
            >
              {stopped ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
            </button>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center gap-2 pr-4 sm:flex">
            <button
              type="button"
              onClick={() => scrollTo(index - 1)}
              aria-label="Previous slide"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(index + 1)}
              aria-label="Next slide"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}
