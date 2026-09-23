import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if a test.only was left in the source. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  /* 'list' prints to the terminal; the HTML report would try to open a browser. */
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  /*
   * Generous timeouts: these run against `next dev`, which compiles each route on its
   * first request, so a first navigation can take a minute on a cold or slow machine.
   * They are ceilings, not waits — a warm run still finishes in seconds.
   */
  timeout: 180_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    navigationTimeout: 150_000,
    actionTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    reuseExistingServer: !process.env.CI,
    url: BASE_URL,
    /* A cold Next.js dev start on a slow machine needs more than the 60 s default. */
    timeout: 180_000,
  },
})
