/**
 * Vision, Mission, Core Values and the theme of the year, as cards lifted over the hero.
 *
 * The idea comes from the Mengo site; the difference here is that the cards sit below
 * the photograph rather than on top of it, so nothing is cut off on a small screen.
 */

import React from 'react'
import { Compass, HeartHandshake, Sparkles, Target } from 'lucide-react'
import { Container } from '../ui'

interface IdentityCardsProps {
  vision?: string | null
  mission?: string | null
  coreValues?: { value: string; description?: string | null }[] | null
  theme?: { year?: string | null; theme?: string | null; reference?: string | null } | null
}

export function IdentityCards({ vision, mission, coreValues, theme }: IdentityCardsProps) {
  const cards = [
    vision && { icon: Compass, title: 'Our vision', body: vision },
    mission && { icon: Target, title: 'Our mission', body: mission },
    coreValues?.length && {
      icon: HeartHandshake,
      title: 'Core values',
      body: coreValues.map((entry) => entry.value).join(' · '),
    },
    theme?.theme && {
      icon: Sparkles,
      title: theme.year ? `${theme.year} theme` : 'Theme of the year',
      body: theme.reference ? `${theme.theme} (${theme.reference})` : theme.theme,
    },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; title: string; body: string }[]

  if (!cards.length) return null

  return (
    <div className="relative z-10 bg-[var(--surface)] pb-14">
      <Container>
        <div className="-mt-10 grid gap-4 sm:grid-cols-2 lg:-mt-16 lg:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-[var(--radius-card)] border-t-4 border-gold-500 bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-raised)]"
            >
              <card.icon className="h-7 w-7 text-maroon-700" aria-hidden />
              <h2 className="mt-3 font-display text-lg text-[var(--text-strong)]">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{card.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </div>
  )
}
