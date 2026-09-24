/**
 * Shell for the student portal (FR-10, NFR-05).
 *
 * Everything under here is dynamic and `noindex`: it shows one student their own records,
 * so there is nothing to cache and nothing a search engine should ever hold.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import '../(site)/brand.css'
import { CREST_SRC } from '../../lib/brand'
import { currentStudent } from '../../lib/session'
import { SignOutButton } from '../../components/portal/SignOutButton'

/** Never cached: a page here belongs to one student. */
export const dynamic = 'force-dynamic'

const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--font-playfair' })
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: { default: 'Student portal', template: '%s — Student portal' },
  robots: { index: false, follow: false, nocache: true },
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const student = await currentStudent()

  return (
    <html lang="en-UG" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="flex min-h-screen flex-col bg-[var(--surface-sunken)]">
        <a href="#portal-main" className="skip-link">
          Skip to content
        </a>

        <header className="border-b border-maroon-900/40 bg-maroon-800 text-white">
          <div className="container-site flex items-center justify-between gap-4 py-3">
            <Link href="/" className="flex shrink-0 items-center gap-3 rounded-md py-1">
              <Image
                src={CREST_SRC}
                alt=""
                width={44}
                height={44}
                priority
                className="h-10 w-10 shrink-0 object-contain"
              />
              <span className="leading-tight">
                <span className="block font-display text-base font-semibold whitespace-nowrap">
                  Student portal
                </span>
                <span className="block text-[11px] tracking-[0.18em] text-gold-300 uppercase">
                  Alliance High Nansana
                </span>
              </span>
            </Link>

            {student ? (
              <div className="flex items-center gap-4">
                <span className="hidden text-sm text-cream-200 sm:block">
                  {student.admissionNo}
                </span>
                <SignOutButton />
              </div>
            ) : (
              <Link href="/" className="text-sm text-cream-200 hover:text-gold-300">
                Back to the website
              </Link>
            )}
          </div>
        </header>

        <main id="portal-main" className="flex-1 py-10">
          {children}
        </main>

        <footer className="border-t border-cream-300 bg-[var(--surface-raised)] py-6">
          <div className="container-site flex flex-col gap-2 text-xs text-[var(--text-muted)] sm:flex-row sm:justify-between">
            <p>&copy; {new Date().getFullYear()} Alliance High School Nansana</p>
            <Link href="/privacy" className="hover:text-maroon-700">
              How your information is used
            </Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
