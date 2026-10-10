/**
 * The 404 for any address that matches no route (enabled by `globalNotFound` in
 * next.config.ts).
 *
 * The app has three root layouts (site, portal, admin), so there is no single layout to
 * wrap a 404 in, and without this file Next shows its own unbranded page. Next skips every
 * layout here, so this file brings its own styles and a slim branded header. It does not
 * read the CMS: a mistyped address must never cost a database connection.
 */

import React from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import '@fontsource-variable/dm-sans'
import '@fontsource/playfair-display'
import './(site)/brand.css'
import { CREST_SRC } from '../lib/brand'
import { NotFoundContent } from '../components/layout/NotFoundContent'

const SCHOOL_NAME = 'Alliance High School Nansana'

export const metadata: Metadata = {
  title: `Page not found — ${SCHOOL_NAME}`,
  robots: { index: false, follow: true },
}

export default function GlobalNotFound() {
  return (
    <html lang="en-UG" className="font-playfair-display font-dm-sans-variable">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-maroon-900/40 bg-maroon-800 text-white shadow-[var(--shadow-card)]">
          <div className="container-site flex items-center py-3">
            <Link href="/" className="flex items-center gap-3 rounded-md py-1" aria-label={`${SCHOOL_NAME}, home`}>
              <Image src={CREST_SRC} alt="" width={48} height={48} priority className="h-11 w-11 object-contain" />
              <span className="font-display text-base font-semibold sm:text-lg">{SCHOOL_NAME}</span>
            </Link>
          </div>
        </header>

        <main id="main" className="flex-1">
          <NotFoundContent />
        </main>
      </body>
    </html>
  )
}
