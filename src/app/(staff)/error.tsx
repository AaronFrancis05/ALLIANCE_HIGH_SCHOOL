'use client'

/**
 * Shown inside the staff portal's header and footer when a staff page fails to render. It
 * sends the staff member back to the portal rather than the public home page.
 */

import React from 'react'
import { ErrorContent } from '../../components/layout/ErrorContent'

export default function StaffError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <title>This page could not load | Staff portal</title>
      <ErrorContent digest={error.digest} retry={retry} homeHref="/staff" homeLabel="Back to the staff portal" />
    </>
  )
}
