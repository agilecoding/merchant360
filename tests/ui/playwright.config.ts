import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir:       './specs',
  fullyParallel: true,
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? 2 : 0,
  workers:       process.env.CI ? 2 : undefined,

  reporter: [
    ['html',  { outputFolder: '../../coverage/playwright', open: 'never' }],    
    ['junit', { outputFile: '../../coverage/playwright/results.xml' }],
    ['line'],
  ],

  use: {
    baseURL:       BASE_URL,
    trace:         'on-first-retry',
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    // Setup project – runs auth once per worker
    {
      name:    'setup',
      testDir: './',
      testMatch: /global\.setup\.ts/,
      teardown: 'teardown',
    },
    {
      name:    'teardown',
      testDir: './',
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: 'chromium',
      use:  {
        ...devices['Desktop Chrome'],
        storageState: './fixtures/auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* Start Next.js dev server during local runs if not already running */       
  webServer: process.env.CI
    ? undefined
    : {
        command:              'npm run dev',
        cwd:                  '../../apps/web',
        url:                  BASE_URL,
        reuseExistingServer:  true,
        timeout:              60_000,
      },
});
