/**
 * Lists every request on a page that came back 400 or worse, plus console errors.
 * Used to keep the browser console clean (AGENTS.md definition of done).
 *
 *   node scripts/probe-requests.mjs http://localhost:3000/ 360
 */
import { chromium } from '@playwright/test'

const url = process.argv[2] ?? 'http://localhost:3000/'
const width = Number(process.argv[3] ?? 360)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height: 780 } })

const failures = new Set()
const consoleErrors = []

page.on('response', (response) => {
  if (response.status() >= 400) failures.add(`${response.status()}  ${response.url().slice(0, 220)}`)
})
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 200))
})
page.on('pageerror', (error) => consoleErrors.push(`PAGEERROR ${error.message.slice(0, 200)}`))

await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 })

console.log(failures.size ? `Failed requests:\n${[...failures].join('\n')}` : 'All requests ok')
console.log(consoleErrors.length ? `\nConsole errors:\n${consoleErrors.join('\n')}` : '\nConsole clean')

await browser.close()
