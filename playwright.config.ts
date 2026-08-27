import { defineConfig, devices } from '@playwright/test';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: packageJson.devServer.url,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev:renderer',
    url: packageJson.devServer.url,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
