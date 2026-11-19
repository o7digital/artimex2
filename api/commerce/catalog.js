// Preview-only public catalogue. Directus credentials remain on Railway.
import { publicProduct } from '../../cms/studio/catalog-contract.mjs';
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (process.env.VERCEL_ENV === 'production' || !process.env.COMMERCE_STUDIO_URL) return res.status(503).json({ error: 'Development catalog is not configured' });
  try {
    const url = new URL('/catalog', process.env.COMMERCE_STUDIO_URL);
    if (url.protocol !== 'https:') throw new Error('HTTPS required');
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'error' });
    if (!response.ok) throw new Error('Catalog unavailable');
    const data = await response.json();
    if (!Array.isArray(data.products)) throw new Error('Invalid catalog');
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ products: data.products.map(publicProduct).filter(Boolean), currency: 'USD', checkoutEnabled: false });
  } catch { res.setHeader('Cache-Control', 'no-store'); return res.status(503).json({ error: 'Catalog unavailable' }); }
}
