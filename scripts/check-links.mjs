/**
 * Crawls the running site and reports any internal link that does not return 200.
 *
 *   pnpm dev                       (in one terminal)
 *   node scripts/check-links.mjs   (in another)
 *
 * A menu that leads to a 404 is the fastest way to lose a parent's trust, so this is worth
 * running before any release.
 */

const BASE = process.argv[2] ?? 'http://localhost:3000'

/** Not crawled: they are behind a login, or they are not HTML. */
const SKIP = [/^\/admin/, /^\/api\//, /\.(xml|txt|png|jpe?g|webp|pdf|ico|svg)$/i]

const seen = new Set()
const queue = ['/']
const failures = []
const checked = []

function normalise(href) {
  if (!href) return null
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return null
  const [path] = href.split('#')
  if (!path.startsWith('/')) return null
  return path.replace(/\/$/, '') || '/'
}

while (queue.length) {
  const path = queue.shift()
  if (seen.has(path)) continue
  seen.add(path)

  if (SKIP.some((pattern) => pattern.test(path))) continue

  let response
  try {
    response = await fetch(`${BASE}${path}`, { redirect: 'follow' })
  } catch (error) {
    failures.push({ path, status: `fetch failed: ${error.message}` })
    continue
  }

  checked.push(path)
  if (!response.ok) {
    failures.push({ path, status: response.status })
    continue
  }

  const html = await response.text()
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const next = normalise(match[1])
    if (next && !seen.has(next)) queue.push(next)
  }
}

console.log(`Checked ${checked.length} pages.`)
for (const path of checked.sort()) console.log(`  200  ${path}`)

if (failures.length) {
  console.error(`\n${failures.length} broken link(s):`)
  for (const failure of failures) console.error(`  ${failure.status}  ${failure.path}`)
  process.exit(1)
}

console.log('\nNo broken internal links.')
