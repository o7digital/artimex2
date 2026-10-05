import type { APIRoute } from 'astro';
import { indexablePaths } from '../data/seo';
export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const entries = indexablePaths.map((path, i) => {
    const pair = i < 2 ? indexablePaths.slice(0, 2) : indexablePaths.slice(2);
    return `<url><loc>${url(path)}</loc>${[['es', pair[0]], ['en', pair[1]], ['x-default', pair[0]]].map(([lang, href]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${url(href)}"/>`).join('')}</url>`;
  });
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
