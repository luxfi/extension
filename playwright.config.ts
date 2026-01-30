import { defineConfig, devices } from '@playwright/test'

const IS_CI = process.env.CI === 'true'

export default defineConfig({
  testDir: './e2e/tests',
  testMatch: '**/*.test.ts',

  // Run tests sequentially - extensions need careful handling
  workers: 1,
  fullyParallel: false,

  // Fail fast in CI
  maxFailures: IS_CI ? 5 : undefined,

  // Retry failed tests in CI
  retries: IS_CI ? 2 : 0,

  // Reporter
  reporter: IS_CI
    ? [['html', { open: 'never' }], ['github'], ['list']]
    : [['html', { open: 'on-failure' }], ['list']],

  // Global timeout
  timeout: 60_000,

  // Expect timeout
  expect: {
    timeout: 10_000,
  },

  use: {
    // Collect trace on failure
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Extensions require headed mode
    headless: false,

    // Default viewport
    viewport: { width: 1280, height: 720 },

    // Base URL for extension pages
    baseURL: 'chrome-extension://',
  },

  // Output directory for test artifacts
  outputDir: './e2e/test-results',

  // Projects for different browsers
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    // Firefox project (limited extension support in Playwright)
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    // },
  ],

  // Web server to run before tests (if needed)
  // webServer: {
  //   command: 'pnpm dev',
  //   port: 9998,
  //   reuseExistingServer: !IS_CI,
  // },
})
