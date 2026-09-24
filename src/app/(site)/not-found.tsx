/**
 * The page a visitor lands on after a broken or out-of-date link.
 *
 * It offers the places people are usually looking for rather than a dead end.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, ButtonLink } from '../../components/ui'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

const SUGGESTIONS = [
  { label: 'Admissions', href: '/admissions' },
  { label: 'Fees structure', href: '/admissions/fees' },
  { label: 'Academics', href: '/academics' },
  { label: 'News', href: '/news' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact the school', href: '/contact' },
]

export default function NotFound() {
  return (
    <Section tone="plain" className="py-20">
      <Container className="max-w-2xl text-center">
        <p className="font-display text-6xl text-maroon-700">404</p>
        <h1 className="mt-4 text-3xl sm:text-4xl">We could not find that page</h1>
        <p className="mt-4 text-[var(--text-body)]">
          The link may be out of date, or the page may have moved. Here is where most people are
          heading.
        </p>

        <ul className="mt-8 flex flex-wrap justify-center gap-3">
          {SUGGESTIONS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-lg border border-cream-300 bg-[var(--surface-raised)] px-4 text-sm font-medium hover:border-maroon-700 hover:text-maroon-700"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <ButtonLink href="/">Back to the home page</ButtonLink>
        </div>
      </Container>
    </Section>
  )
}
