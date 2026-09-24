import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Unit tests are pure and always run. The integration tests need a live database,
    // so they are opt-in via `pnpm test:int`.
    include: ['tests/unit/**/*.spec.ts'],
  },
})
