'use client'

/**
 * The counters strip. Numbers count up once, when scrolled into view, and skip the
 * animation entirely for anyone who prefers reduced motion.
 */

import React, { useEffect, useRef, useState } from 'react'
import { isContentPlaceholder } from '../ui'

interface Stat {
  value: string
  label: string
}

function useCountUp(target: number, start: boolean, durationMs = 1200) {
  const [value, setValue] = useState(start ? target : 0)

  useEffect(() => {
    if (!start) return

    // Anyone who prefers reduced motion gets the final figure on the first frame rather
    // than the count-up. Doing it through the same loop keeps setState out of the effect
    // body, which would otherwise cause a cascading render.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = prefersReduced ? 0 : durationMs

    let frame = 0
    const startedAt = performance.now()

    const tick = (now: number) => {
      const progress = duration > 0 ? Math.min((now - startedAt) / duration, 1) : 1
      // Ease out, so it slows towards the final figure.
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, start, durationMs])

  return value
}

function StatItem({ stat, visible }: { stat: Stat; visible: boolean }) {
  // A figure the school has not supplied yet, written as "[Number of students]", is shown
  // as it stands. Counting up to the "0" inside it would read as a real figure of zero.
  const placeholder = isContentPlaceholder(stat.value)

  // Split "1,200+" into the number and whatever surrounds it.
  const match = placeholder ? null : stat.value.match(/^(\D*)([\d,]+)(.*)$/)
  const numeric = match ? Number(match[2].replace(/,/g, '')) : 0
  const counted = useCountUp(numeric, visible)

  const display = match ? `${match[1]}${counted.toLocaleString('en-UG')}${match[3]}` : stat.value

  return (
    <div className="text-center">
      <p className="font-display text-4xl font-semibold text-gold-400 sm:text-5xl">{display}</p>
      <p className="mt-2 text-sm text-cream-200">{stat.label}</p>
    </div>
  )
}

export function Stats({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  if (!stats.length) return null

  return (
    <section className="bg-maroon-800 py-12" ref={ref}>
      <div className="container-site grid grid-cols-2 gap-8 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatItem key={stat.label} stat={stat} visible={visible} />
        ))}
      </div>
    </section>
  )
}
