import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://artimex2.vercel.app',
  output: 'static',
  integrations: [react()],
  build: { inlineStylesheets: 'auto' },
});
