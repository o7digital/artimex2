import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: process.env.PREVIEW_URL || 'http://127.0.0.1:4174', browserName: 'chromium', channel: 'chrome' },
  webServer: process.env.PREVIEW_URL ? undefined : { command: 'npm run preview', url: 'http://127.0.0.1:4174', reuseExistingServer: false },
});
