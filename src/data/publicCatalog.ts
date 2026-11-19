import { catalogProducts, type ShopProduct } from './commerce';
import type { Locale } from './content';

let request: Promise<unknown[]> | undefined;
export async function loadPublicCatalog(locale: Locale): Promise<ShopProduct[] | undefined> {
  const base = import.meta.env.COMMERCE_STUDIO_URL;
  // Only development previews use the development catalog. Production keeps its approved content.
  if (process.env.VERCEL_ENV === 'production' || !base) return undefined;
  request ??= (async () => {
    const url = new URL('/catalog', base);
    if (url.protocol !== 'https:') throw new Error('Catalog requires HTTPS.');
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'error' });
    if (!response.ok) throw new Error(`Catalog unavailable (${response.status}).`);
    const data = await response.json();
    if (!Array.isArray(data.products)) throw new Error('Catalog response is invalid.');
    return data.products;
  })();
  const rows = await request;
  return rows.length ? catalogProducts(rows, locale) : undefined;
}
