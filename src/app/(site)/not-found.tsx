/**
 * The page a visitor lands on after a broken or out-of-date link inside the public site,
 * such as a news story that has been unpublished. It renders inside the site's header
 * and footer. Addresses that match no route at all get src/app/global-not-found.tsx.
 */

import React from 'react'
import type { Metadata } from 'next'
import { NotFoundContent } from '../../components/layout/NotFoundContent'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return <NotFoundContent />
}
