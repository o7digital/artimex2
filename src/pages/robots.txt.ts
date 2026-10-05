import type { APIRoute } from 'astro';
import { indexingEnabled } from '../data/seo';
export const GET: APIRoute = ({ site }) => new Response(
  `User-agent: *\n${indexingEnabled ? 'Allow: /' : 'Disallow: /'}\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
