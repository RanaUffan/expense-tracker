import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Boots both servers before the tests run, and reuses them if
  // they're already running locally (e.g. you started them yourself
  // in two terminals) rather than starting duplicates. The backend
  // picks up DATABASE_URL from its own backend/.env automatically
  // (via `node --env-file-if-exists`), so no extra env override is
  // needed here — these tests run against the same real database as
  // everything else and create clearly-prefixed ("e2e-...") accounts.
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../backend',
      port: 4000,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      cwd: '../frontend',
      port: 5173,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
