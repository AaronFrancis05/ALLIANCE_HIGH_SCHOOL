/**
 * The Head Teacher's welcome: a portrait beside a short message. This is the section
 * parents read most closely, so it stays plain and personal.
 */

import React from 'react'
import { Container, ButtonLink, Section, Prose } from '../ui'
import { MediaImage, PlaceholderNote, isMedia } from '../ui/MediaImage'
import { InitialsAvatar } from '../ui'
import type { Media } from '../../payload-types'

interface WelcomeProps {
  heading?: string | null
  name: string
  title?: string | null
  message: string
  photo?: Media | number | string | null
  readMoreHref?: string | null
}

export function Welcome({ heading, name, title, message, photo, readMoreHref }: WelcomeProps) {
  return (
    <Section tone="plain">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="relative mx-auto w-full max-w-sm">
            {isMedia(photo) ? (
              <div className="relative aspect-4/5 overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-raised)]">
                <MediaImage media={photo} sizes="(max-width: 1024px) 90vw, 380px" />
                <PlaceholderNote media={photo} />
              </div>
            ) : (
              <InitialsAvatar name={name} className="aspect-4/5 text-5xl" />
            )}
            <div className="mt-4 text-center lg:text-left">
              <p className="font-display text-lg text-[var(--text-strong)]">{name}</p>
              <p className="text-sm text-maroon-700">{title ?? 'Head Teacher'}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 inline-block rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-semibold tracking-widest text-maroon-700 uppercase">
              Welcome
            </p>
            <h2 className="text-3xl sm:text-4xl">{heading ?? 'Welcome from the Head Teacher'}</h2>
            <Prose className="mt-5 text-[var(--text-body)]">
              {message.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </Prose>
            {readMoreHref ? (
              <ButtonLink href={readMoreHref} variant="secondary" className="mt-6">
                Read our story
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  )
}
