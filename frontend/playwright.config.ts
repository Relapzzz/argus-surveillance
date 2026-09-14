import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:5173', channel: 'chrome', headless: true, viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
  webServer: { command: 'bun run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI, env: { VITE_USE_FIXTURE: 'true' } },
})
