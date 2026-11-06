import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/challenge-browser',
  outputDir: '.local/challenge-test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  reporter: [
    ['list'],
    ['html', { outputFolder: '.local/challenge-report', open: 'never' }],
    ['json', { outputFile: '.local/challenge-results.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4340',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/challenge-test-server.mjs',
    url: 'http://127.0.0.1:4340',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
