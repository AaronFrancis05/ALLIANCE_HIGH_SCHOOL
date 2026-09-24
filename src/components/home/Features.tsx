/**
 * "Why choose us" cards, each with a photograph. Four across on a desktop, one on a
 * phone.
 */

import React from 'react'
import { BookOpen, FlaskConical, Heart, Star, Trophy, Users } from 'lucide-react'
import { Container, Section, SectionHeading } from '../ui'
import { MediaImage, PlaceholderNote, isMedia } from '../ui/MediaImage'
import type { Media } from '../../payload-types'

const icons = {
  book: BookOpen,
  flask: FlaskConical,
  trophy: Trophy,
  users: Users,
  heart: Heart,
  star: Star,
} as const

export interface Feature {
  title: string
  body: string
  icon?: keyof typeof icons | null
  image?: Media | number | string | null
}

export function Features({ features }: { features: Feature[] }) {
  if (!features.length) return null

  return (
    <Section tone="sunken">
      <Container>
        <SectionHeading
          eyebrow="Why choose us"
          title="An education that goes beyond the classroom"
          lead="Strong teaching, a safe and orderly campus, and room for every student to find what they are good at."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = icons[feature.icon ?? 'star'] ?? Star

            return (
              <article
                key={feature.title}
                className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-[var(--shadow-card)]"
              >
                {isMedia(feature.image) ? (
                  <div className="relative aspect-4/3 w-full">
                    <MediaImage
                      media={feature.image}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <PlaceholderNote media={feature.image} />
                  </div>
                ) : null}

                <div className="p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-maroon-50">
                    <Icon className="h-5 w-5 text-maroon-700" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-lg text-[var(--text-strong)]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{feature.body}</p>
                </div>
              </article>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
