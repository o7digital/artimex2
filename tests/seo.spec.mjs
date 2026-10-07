import { test, expect } from '@playwright/test';

const site = process.env.PUBLIC_SITE_URL || 'https://www.artimexbakery.com';
const indexingEnabled = process.env.VERCEL_ENV !== 'preview' && process.env.SEO_NOINDEX !== 'true';
const url = path => new URL(path, site).href;
const routes = [
  ['/', 'en', '/en/'],
  ['/es/', 'es', '/es/'],
  ['/en/', 'en', '/en/'],
  ['/es/aviso-de-privacidad/', 'es', '/es/aviso-de-privacidad/'],
  ['/en/privacy-notice/', 'en', '/en/privacy-notice/'],
];
for (const [route, lang, canonical] of routes) {
  test(`SEO metadata in initial HTML: ${route}`, async ({ request }) => {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toMatch(new RegExp(`<html\\s[^>]*lang="${lang}"`));
    expect(html).toContain(indexingEnabled ? 'content="index, follow, max-image-preview:large"' : 'content="noindex, follow"');
    expect(html).toContain(`<link rel="canonical" href="${url(canonical)}">`);
    expect(html).toContain(`property="og:url" content="${url(canonical)}"`);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html.includes('https://www.googletagmanager.com/gtag/js?id=G-XYW57L5XTR')).toBe(process.env.VERCEL_ENV !== 'preview');
    const languages = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
    expect(languages.map(match => match[1])).toEqual(['es', 'en', 'x-default']);
    expect(languages[2][2]).toBe(languages[1][2]);
    for (const [, , href] of languages) {
      expect(href).toMatch(/^https:\/\//);
      const target = await request.get(new URL(href).pathname);
      expect(target.status()).toBe(200);
    }
    if (!route.includes('privacidad') && !route.includes('privacy')) {
      const json = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
      expect(json).toBeTruthy();
      const bakery = JSON.parse(json[1]);
      expect(bakery['@type']).toBe('Bakery');
      expect(bakery.address.postalCode).toBe('90670');
      expect(bakery.telephone).toBe('+15627770924');
      expect(bakery.url).toBe(url('/en/'));
      expect(bakery).not.toHaveProperty('aggregateRating');
      const image = await request.get(new URL(bakery.image).pathname);
      expect(image.status()).toBe(200);
      expect(html).toContain('Concha Chocolate');
      expect(html).not.toMatch(/<img[^>]*src="\/fotos\//);
      expect(html).toContain('width="750" height="450"');
    }
  });
}

test('Crawl files include canonical routes and exclude the box demo', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(`${indexingEnabled ? 'Allow: /' : 'Disallow: /'}\n\nSitemap: ${url('/sitemap.xml')}`);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('xml');
  const xml = await sitemap.text();
  const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  expect(paths).toEqual(routes.slice(1).map(([, , path]) => url(path)));
  expect(xml).not.toContain('/box/');
  const box = await request.get('/box/');
  expect(await box.text()).toContain('content="noindex, nofollow"');
});

test('Bread images are responsive WebP with bounded payloads', async ({ request }) => {
  for (const width of [375, 750]) {
    const response = await request.get(`/images/breads/concha-chocolate-${width}.webp`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/webp');
    expect((await response.body()).length).toBeLessThan(150_000);
  }
});
