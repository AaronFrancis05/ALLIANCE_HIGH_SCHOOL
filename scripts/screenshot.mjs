import { chromium } from '@playwright/test'
const out = process.argv[2]
const url = process.argv[3]
const width = Number(process.argv[4] || 1280)
const full = process.argv[5] !== 'viewport'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message.slice(0, 200)))
await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
await page.waitForTimeout(1200)
await page.screenshot({ path: out, fullPage: full })
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'console clean')
await browser.close()
