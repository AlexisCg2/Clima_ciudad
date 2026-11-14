import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        viewport: { width: 360, height: 800 },
      },
    },
  ],
  webServer: {
    command: 'npm.cmd run start -- -p 3001',
    port: 3001,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
