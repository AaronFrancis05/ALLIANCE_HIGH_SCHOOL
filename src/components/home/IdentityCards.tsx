/**
 * Vision, Mission, Core Values and the theme of the year, as a row of cards under the hero.
 *
 * The idea comes from the Mengo site. The cards sit fully below the photograph, never
 * over it, so they leave the hero's slide controls clear and nothing is cut off on a
 * small screen.
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
      body: coreValues.map((entry) => entry.value).join(', '),
    },
    theme?.theme && {
      icon: Sparkles,
      title: theme.year ? `${theme.year} theme` : 'Theme of the year',
      body: theme.reference ? `${theme.theme} (${theme.reference})` : theme.theme,
    },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; title: string; body: string }[]

  if (!cards.length) return null

  return (
    <div className="bg-[var(--surface)] py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.title}
              data-reveal
              className="motion-lift flex flex-col rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-card)] sm:p-7"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon-50 text-maroon-700">
                <card.icon className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="mt-5 font-display text-xl text-[var(--text-strong)]">{card.title}</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{card.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </div>
  )
}
