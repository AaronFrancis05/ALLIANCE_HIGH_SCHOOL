'use client'

/**
 * The last line of defence: shown when a root layout fails, for example when the portal
 * layout cannot reach the database to read the session. Without it Next shows its own
 * unbranded "This page couldn't load".
 *
 * Next replaces the whole document with this file, so, like global-not-found.tsx, it brings
 * its own styles and a slim branded header and reads nothing from the CMS.
 */

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import '@fontsource-variable/dm-sans'
import '@fontsource/playfair-display'
import './(site)/brand.css'
import { CREST_SRC } from '../lib/brand'
import { ErrorContent } from '../components/layout/ErrorContent'

const SCHOOL_NAME = 'Alliance High School Nansana'

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en-UG" className="font-playfair-display font-dm-sans-variable">
      <body className="flex min-h-screen flex-col">
        <title>{`This page could not load | ${SCHOOL_NAME}`}</title>
        <header className="border-b border-maroon-900/40 bg-maroon-800 text-white shadow-[var(--shadow-card)]">
          <div className="container-site flex items-center py-3">
            <Link href="/" className="flex items-center gap-3 rounded-md py-1" aria-label={`${SCHOOL_NAME}, home`}>
              <Image src={CREST_SRC} alt="" width={48} height={48} priority className="h-11 w-11 object-contain" />
              <span className="font-display text-base font-semibold sm:text-lg">{SCHOOL_NAME}</span>
            </Link>
          </div>
        </header>

        <main id="main" className="flex-1">
          <ErrorContent digest={error.digest} retry={retry} />
        </main>
      </body>
    </html>
  )
}
