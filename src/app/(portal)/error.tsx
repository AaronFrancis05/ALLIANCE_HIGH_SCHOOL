'use client'

/**
 * Shown inside the portal's header and footer when a portal page fails to render. It sends
 * the student back to the portal rather than the public home page. A failure in the portal
 * layout itself (for example the session lookup) is caught by src/app/global-error.tsx.
 */

import React from 'react'
import { ErrorContent } from '../../components/layout/ErrorContent'

export default function PortalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <title>This page could not load | Student portal</title>
      <ErrorContent digest={error.digest} retry={retry} homeHref="/portal" homeLabel="Back to the portal" />
    </>
  )
}
