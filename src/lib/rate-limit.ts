/**
 * Rate limiting for the routes an attacker would hammer: sign-in, application
 * submission, tracking lookup and OTP requests (A04, A07).
 *
 * In-memory and per-process, which is right for a single VPS container and for local
 * development. Cloudflare's own rate limiting sits in front of this in production; if
 * the app is ever scaled to several instances, swap the store for Redis and keep this
 * interface.
 */

import { logger } from './logger'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Stops the map growing without bound on a long-running server. */
function sweep(now: number) {
  if (buckets.size < 5000) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitRule {
  /** Requests allowed inside the window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
}

export const RATE_LIMITS = {
  login: { limit: 10, windowSeconds: 60 },
  application: { limit: 5, windowSeconds: 60 },
  tracking: { limit: 10, windowSeconds: 60 },
  otp: { limit: 3, windowSeconds: 300 },
  contactForm: { limit: 5, windowSeconds: 600 },
  fileDownload: { limit: 60, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitRule>

export type RateLimitName = keyof typeof RATE_LIMITS

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Seconds until the caller may try again. */
  retryAfter: number
}

export function checkRateLimit(name: RateLimitName, identifier: string): RateLimitResult {
  const rule = RATE_LIMITS[name]
  const now = Date.now()
  sweep(now)

  const key = `${name}:${identifier}`
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowSeconds * 1000 })
    return { allowed: true, remaining: rule.limit - 1, retryAfter: 0 }
  }

  existing.count += 1

  if (existing.count > rule.limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
    logger.warn('Rate limit hit', { rule: name, retryAfter })
    return { allowed: false, remaining: 0, retryAfter }
  }

  return { allowed: true, remaining: rule.limit - existing.count, retryAfter: 0 }
}

/** The caller's IP, taken from the proxy headers Cloudflare and Vercel set. */
export function clientIdentifier(request: Request): string {
  const headers = request.headers
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
  ]
  return candidates.find(Boolean) ?? 'unknown'
}

/** Only used by tests, to start from a clean slate. */
export function resetRateLimits(): void {
  buckets.clear()
}
