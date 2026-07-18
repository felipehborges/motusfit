import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --filter @motusfit/api exec tsx src/server.ts',
      url: 'http://localhost:3001/api/v1/health',
      reuseExistingServer: !process.env.CI,
      cwd: '../..',
      env: {
        BETTER_AUTH_SECRET: 'e2e-secret-motusfit-com-32-chars-ok!',
        NODE_ENV: 'development',
      },
    },
    {
      command: 'pnpm --filter web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      cwd: '../..',
    },
  ],
});
