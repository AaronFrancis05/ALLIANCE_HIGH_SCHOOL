// @vitest-environment node

import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const source = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8')
const origin = 'https://school.example'

type WorkerRequest = { url: string; method: string; mode: string }
type FetchEvent = { request: WorkerRequest; respondWith: (response: Promise<Response>) => void }

function worker(cached?: Response, online?: Response) {
  const listeners = new Map<string, (event: FetchEvent) => void>()
  const match = vi.fn().mockResolvedValue(cached)
  const fetch = online
    ? vi.fn().mockResolvedValue(online)
    : vi.fn().mockRejectedValue(new Error('offline'))
  runInNewContext(source, {
    self: {
      location: { origin },
      addEventListener: (name: string, listener: (event: FetchEvent) => void) =>
        listeners.set(name, listener),
    },
    caches: { match },
    fetch,
    URL,
    Response,
  })
  function dispatch(path: string, mode = 'cors', method = 'GET') {
    const request = { url: new URL(path, origin).href, method, mode }
    const respondWith = vi.fn<(response: Promise<Response>) => void>()
    listeners.get('fetch')!({ request, respondWith })
    return { request, respondWith, response: respondWith.mock.calls[0]?.[0] }
  }
  return { dispatch, match, fetch }
}

describe('service worker fetch fallback', () => {
  it.each([
    ['/portal/results', 'navigate', '/offline.html'],
    ['/offline.html', 'cors', null],
    ['/brand/crest.png?v=2', 'cors', null],
    ['/favicon-32.png', 'cors', null],
  ])('preserves a cached response for %s', async (path, mode, cacheKey) => {
    const cached = new Response('cached')
    const { dispatch, match } = worker(cached)
    const { request, response } = dispatch(path, mode)
    expect(await response).toBe(cached)
    expect(match).toHaveBeenCalledWith(cacheKey ?? request)
  })

  it.each([
    ['/portal/results', 'navigate'],
    ['/favicon-32.png', 'cors'],
  ])('returns 503 when the cache is empty for %s', async (path, mode) => {
    const { dispatch } = worker()
    const response = await dispatch(path, mode).response
    expect(response).toBeInstanceOf(Response)
    expect(response?.status).toBe(503)
  })

  it.each([
    'https://external.example/favicon-32.png',
    'https://external.example/brand/crest.png?v=2',
    '/nested/favicon-32.png',
    '/brand/crest.png?v=3',
    '/api/students/me',
  ])('does not intercept an unrelated asset: %s', (path) => {
    const { dispatch, fetch, match } = worker()
    expect(dispatch(path).respondWith).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(match).not.toHaveBeenCalled()
  })

  it('does not intercept non-GET assets', () => {
    expect(worker().dispatch('/favicon-32.png', 'cors', 'POST').respondWith).not.toHaveBeenCalled()
  })

  it.each([
    ['/portal/results', 'navigate'],
    ['/favicon-32.png', 'cors'],
  ])('preserves the network response for %s without reading the cache', async (path, mode) => {
    const online = new Response('network')
    const { dispatch, match } = worker(undefined, online)
    expect(await dispatch(path, mode).response).toBe(online)
    expect(match).not.toHaveBeenCalled()
  })
})
