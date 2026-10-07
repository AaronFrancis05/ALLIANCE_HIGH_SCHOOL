/**
 * Content Security Policy from src/proxy.ts.
 *
 * Statically generated public pages cannot carry a nonce, so a nonce policy there blocks
 * every script (the Vercel site lost its menus and carousel this way). The portal and the
 * admin panel are rendered per request and must keep the nonce, passed to Next on the request.
 */

import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '../../src/proxy'

function scriptSrc(csp: string | null): string {
  return csp?.split('; ').find((directive) => directive.startsWith('script-src')) ?? ''
}

function requestCsp(response: Response): string | null {
  return response.headers.get('x-middleware-request-content-security-policy')
}

describe('proxy CSP', () => {
  it('lets static public pages run their own scripts without a nonce', () => {
    const response = proxy(new NextRequest('https://example.test/about'))
    const policy = scriptSrc(response.headers.get('Content-Security-Policy'))

    expect(policy).toContain(`'self'`)
    expect(policy).toContain(`'unsafe-inline'`)
    expect(policy).not.toContain('nonce-')
    expect(policy).not.toContain(`'strict-dynamic'`)
    expect(requestCsp(response)).toBeNull()
  })

  it.each(['/portal', '/admin'])('gives %s a nonce and passes it to Next on the request', (path) => {
    const response = proxy(new NextRequest(`https://example.test${path}`))
    const csp = response.headers.get('Content-Security-Policy')
    const policy = scriptSrc(csp)

    expect(policy).toMatch(/'nonce-[0-9a-f]{32}'/)
    expect(policy).toContain(`'strict-dynamic'`)
    expect(policy).not.toContain(`'unsafe-inline'`)
    expect(requestCsp(response)).toBe(csp)
  })

  it('issues a fresh nonce on every request', () => {
    const first = proxy(new NextRequest('https://example.test/portal'))
    const second = proxy(new NextRequest('https://example.test/portal'))

    expect(first.headers.get('Content-Security-Policy')).not.toBe(
      second.headers.get('Content-Security-Policy'),
    )
  })
})
