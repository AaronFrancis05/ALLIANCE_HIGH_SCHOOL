/**
 * Security headers and Content Security Policy (A05).
 *
 * In Next.js 16 this file is what earlier versions called `middleware.ts`.
 *
 * The policy uses a per-request nonce rather than 'unsafe-inline', so an injected
 * <script> cannot run even if something slipped through output escaping. The admin panel
 * needs slightly looser rules than the public site, which is why the two are separated.
 */

import { NextResponse, type NextRequest } from 'next/server'

const isProduction = process.env.NODE_ENV === 'production'

function buildCsp(nonce: string, isAdmin: boolean): string {
  const scriptSrc = [
    `'self'`,
    `'nonce-${nonce}'`,
    `'strict-dynamic'`,
    // Next's dev server and the admin panel both need eval; production public pages do not.
    ...(isProduction && !isAdmin ? [] : [`'unsafe-eval'`]),
  ]

  const directives: Record<string, string[]> = {
    'default-src': [`'self'`],
    'script-src': scriptSrc,
    // Tailwind and the admin panel both inject style tags at runtime.
    'style-src': [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
    'font-src': [`'self'`, 'https://fonts.gstatic.com', 'data:'],
    'img-src': [`'self'`, 'data:', 'blob:', 'https://i.ytimg.com', 'http://localhost:9000', 'https:'],
    'media-src': [`'self'`, 'https:'],
    'connect-src': [`'self'`, 'http://localhost:9000', 'https:', ...(isProduction ? [] : ['ws:'])],
    // YouTube is loaded only after a click, through the facade component.
    'frame-src': [`'self'`, 'https://www.youtube-nocookie.com', 'https://www.youtube.com', 'https://www.google.com'],
    'frame-ancestors': [`'none'`],
    'form-action': [`'self'`],
    'base-uri': [`'self'`],
    'object-src': [`'none'`],
  }

  if (isProduction) directives['upgrade-insecure-requests'] = []

  return Object.entries(directives)
    .map(([key, values]) => (values.length ? `${key} ${values.join(' ')}` : key))
    .join('; ')
}

export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const isAdmin = request.nextUrl.pathname.startsWith('/admin')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  response.headers.set('Content-Security-Policy', buildCsp(nonce, isAdmin))
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  )

  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  // The portal and the admin panel must never be cached by a shared proxy.
  if (isAdmin || request.nextUrl.pathname.startsWith('/portal')) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
}

export const config = {
  matcher: [
    // Everything except static files and images, which need no headers of their own.
    '/((?!_next/static|_next/image|photos|brand|favicon|icon-|apple-touch-icon).*)',
  ],
}
