/**
 * Shell for the staff portal (FR-05, NFR-05).
 *
 * Every staff member except the super admin signs in here. Staff who hold a role go on to
 * the admin screens for that work; everyone has their profile and the staff directory.
 * Everything under here is dynamic and `noindex`.
 */

import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import '../(site)/brand.css'
import { CREST_SRC } from '../../lib/brand'
import { currentStaff } from '../../lib/session'
import { canUseAdminScreens } from '../../access/roles'
import { SignOutButton } from '../../components/portal/SignOutButton'
import { ServiceWorkerRegister } from '../../components/layout/ServiceWorkerRegister'
import { MotionReveal } from '../../components/layout/MotionReveal'
import { BackToTop } from '../../components/layout/BackToTop'
import { signOutAction } from './staff/actions'

/** Never cached: a page here belongs to one staff member. */
export const dynamic = 'force-dynamic'

const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--font-playfair' })
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: { default: 'Staff portal', template: '%s | Staff portal' },
  robots: { index: false, follow: false, nocache: true },
  // Without these the browser asks for /favicon.ico, which does not exist.
  icons: {
    icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
}

const navLinkClass =
  'inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap text-cream-200 hover:bg-maroon-700 hover:text-white'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staff = await currentStaff()

  return (
    <html lang="en-UG" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="flex min-h-screen flex-col bg-[var(--surface-sunken)]">
        <a href="#staff-main" className="skip-link">
          Skip to content
        </a>

        <header className="border-b border-maroon-900/40 bg-maroon-800 text-white">
          <div className="container-site flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
            <Link href={staff ? '/staff' : '/'} className="flex shrink-0 items-center gap-3 rounded-md py-1">
              <Image
                src={CREST_SRC}
                alt=""
                width={44}
                height={44}
                priority
                className="h-10 w-10 shrink-0 object-contain"
              />
              <span className="leading-tight">
                <span className="block font-display text-base font-semibold whitespace-nowrap">Staff portal</span>
                <span className="block text-[11px] tracking-[0.18em] text-gold-300 uppercase">
                  Alliance High Nansana
                </span>
              </span>
            </Link>

            {staff ? (
              <nav aria-label="Staff portal" className="-mx-3 flex flex-wrap items-center gap-1 sm:mx-0">
                <Link href="/staff/directory" className={navLinkClass}>
                  Directory
                </Link>
                <Link href="/staff/profile" className={navLinkClass}>
                  Profile
                </Link>
                {canUseAdminScreens(staff) ? (
                  <Link href="/admin" className={navLinkClass}>
                    Work area
                  </Link>
                ) : null}
                <SignOutButton action={signOutAction} />
              </nav>
            ) : (
              <Link href="/" className="text-sm text-cream-200 hover:text-gold-300">
                Back to the website
              </Link>
            )}
          </div>
        </header>

        <main id="staff-main" className="flex-1 py-10">
          {children}
        </main>

        <footer className="border-t border-cream-300 bg-[var(--surface-raised)] py-6">
          <div className="container-site flex flex-col gap-2 text-xs text-[var(--text-muted)] sm:flex-row sm:justify-between">
            <p>&copy; {new Date().getFullYear()} Alliance High School Nansana</p>
            <Link href="/privacy" className="hover:text-maroon-700">
              How information is used
            </Link>
          </div>
        </footer>

        <ServiceWorkerRegister />
        <MotionReveal />
        <BackToTop targetId="staff-main" />
      </body>
    </html>
  )
}
