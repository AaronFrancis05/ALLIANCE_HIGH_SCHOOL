/**
 * Offline fallback (registered by src/components/layout/ServiceWorkerRegister.tsx).
 *
 * It does one thing: when the visitor opens a page and the network request fails outright,
 * it answers with the cached public/offline.html instead of the browser's "No internet"
 * screen. Every request still goes to the network first, and nothing the server returns is
 * ever stored, so portal pages and personal data never reach this cache.
 *
 * Raise CACHE_VERSION whenever offline.html or the crest changes.
 */

const CACHE_VERSION = 1
const CACHE_NAME = `offline-v${CACHE_VERSION}`
const OFFLINE_URL = '/offline.html'
const PRECACHE = [OFFLINE_URL, '/brand/crest.png?v=2', '/favicon-32.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  // The offline page's own crest and icon, which cannot be fetched while offline.
  if (request.method === 'GET' && PRECACHE.some((path) => request.url.endsWith(path))) {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
  }
})
