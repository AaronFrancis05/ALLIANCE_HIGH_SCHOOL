'use client'

/**
 * Registers public/sw.js, which shows public/offline.html when a page is opened with no
 * connection. Production only: in development a service worker would keep serving stale
 * fallbacks while the dev server restarts.
 */

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Without it the browser's own offline screen shows; the site works the same otherwise.
    })
  }, [])

  return null
}
