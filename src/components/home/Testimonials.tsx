/**
 * What parents, students and alumni say. Only shown for people who gave consent, which
 * the CMS makes a required tick box.
 */

import React from 'react'
import { Quote } from 'lucide-react'
import { Container, InitialsAvatar, Section, SectionHeading } from '../ui'
import { MediaImage, isMedia } from '../ui/MediaImage'
import type { Testimonial } from '../../payload-types'

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (!testimonials.length) return null

  return (
    <Section tone="plain">
      <Container>
        <SectionHeading eyebrow="In their words" title="What our community says" />

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.slice(0, 3).map((testimonial) => (
            <figure
              key={testimonial.id}
              className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-card)]"
            >
              <Quote className="h-7 w-7 text-gold-500" aria-hidden />
              <blockquote className="mt-3 flex-1 text-[var(--text-body)] italic">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  {isMedia(testimonial.photo) ? (
                    <span className="relative block h-12 w-12">
                      <MediaImage media={testimonial.photo} sizes="48px" />
                    </span>
                  ) : (
                    <InitialsAvatar name={testimonial.name} className="rounded-full text-base" />
                  )}
                </span>
                <span>
                  <span className="block font-medium text-[var(--text-strong)]">{testimonial.name}</span>
                  <span className="block text-sm text-[var(--text-muted)]">{testimonial.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  )
}
