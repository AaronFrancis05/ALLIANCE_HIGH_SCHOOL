'use client'

/**
 * Shown inside the site's header and footer when a public page fails to render, or when a
 * visitor's connection drops while moving between pages. A failure in the site layout
 * itself is caught by src/app/global-error.tsx instead.
 */

import React from 'react'
import { ErrorContent } from '../../components/layout/ErrorContent'

export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <title>This page could not load | Alliance High School Nansana</title>
      <ErrorContent digest={error.digest} retry={retry} />
    </>
  )
}
