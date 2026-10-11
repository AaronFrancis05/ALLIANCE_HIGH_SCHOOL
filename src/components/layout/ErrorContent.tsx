'use client'

/**
 * The body of every "this page could not load" screen: the public site's and the portal's
 * error boundaries, and src/app/global-error.tsx when a layout itself fails.
 *
 * Most visitors are on phones over paid 4G, where a dropped signal is far more likely than
 * a fault on our side. So it tells the two apart: offline, it says so and retries on its own
 * the moment the connection returns; online, it apologises and offers a retry and a way out.
 *
 * Only the error's digest is shown, never its message: in production that is an opaque hash
 * the office can quote and we can match to the server log, and it carries no personal data.
 */

import React, { useEffect, useSyncExternalStore } from 'react'
import { RefreshCw, ServerCrash, WifiOff } from 'lucide-react'
import { Button, ButtonLink, Container, Section } from '../ui'

function subscribeToConnection(onChange: () => void): () => void {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** The server cannot know, so it assumes online and lets the browser correct it. */
function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribeToConnection,
    () => navigator.onLine,
    () => true,
  )
}

export function ErrorContent({
  digest,
  retry,
  homeHref = '/',
  homeLabel = 'Back to the home page',
}: {
  digest?: string
  retry: () => void
  homeHref?: string
  homeLabel?: string
}) {
  const isOnline = useIsOnline()

  useEffect(() => {
    if (isOnline) return
    const retryWhenBack = () => retry()
    window.addEventListener('online', retryWhenBack, { once: true })
    return () => window.removeEventListener('online', retryWhenBack)
  }, [isOnline, retry])

  const Icon = isOnline ? ServerCrash : WifiOff

  return (
    <Section tone="plain" className="py-20">
      <Container className="max-w-xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-maroon-50 text-maroon-700">
          <Icon aria-hidden className="h-8 w-8" />
        </span>

        <div role="alert">
          {isOnline ? (
            <>
              <h1 className="mt-6 text-3xl sm:text-4xl">This page could not load</h1>
              <p className="mt-4 text-[var(--text-body)]">
                Something went wrong on our side, not yours. Please try again in a moment. If it
                keeps happening, contact the school office.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-3xl sm:text-4xl">You are offline</h1>
              <p className="mt-4 text-[var(--text-body)]">
                Your phone or computer has lost its internet connection. Check your data or
                Wi-Fi. The page will reload as soon as the connection is back.
              </p>
            </>
          )}
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={() => retry()}>
            <RefreshCw aria-hidden className="h-4 w-4" />
            Try again
          </Button>
          <ButtonLink href={homeHref} variant="secondary">
            {homeLabel}
          </ButtonLink>
        </div>

        {isOnline && digest ? (
          <p className="mt-8 text-xs text-[var(--text-muted)]">
            Reference for the school office: <span className="font-mono">{digest}</span>
          </p>
        ) : null}
      </Container>
    </Section>
  )
}
