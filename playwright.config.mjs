import { defineConfig } from '@playwright/test';
const port = Number(process.env.PREVIEW_PORT || 4174);
const localURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests',
  use: { baseURL: process.env.PREVIEW_URL || localURL, browserName: 'chromium', channel: 'chrome' },
  webServer: process.env.PREVIEW_URL ? undefined : { command: `npx astro preview --host 127.0.0.1 --ignore-lock --port ${port}`, url: localURL, reuseExistingServer: false },
});
