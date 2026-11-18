import { products, type Locale } from './content';

export type CustomerType = 'personal' | 'business';
export type Cart = Record<string, number>;
export type ShopProduct = { id: string; name: string; description: string; type: string; image: string; thumbnail: string; kind: string; demoPriceCents: number; category?: string; unitsPerCase?: number; priceAvailable?: boolean; enabledB2c?: boolean; enabledB2b?: boolean; stockQuantity?: number | null };
export const shopPaths = { en: '/en/shop/', es: '/es/tienda/' };
export const cartKey = (type: CustomerType) => `artimex-shop-preview-v1-${type}`;
// Demonstration merchandising only. Replace with validated ERP SKU/price/pack data.
export const shopProducts = (locale: Locale): ShopProduct[] => products[locale].map((product, index) => ({
  ...product,
  demoPriceCents: [325, 300, 325, 275, 325, 250, 350, 350, 375, 425, 300, 375][index],
}));
export function catalogProducts(value: unknown, locale: Locale): ShopProduct[] {
  if (!Array.isArray(value) || value.length > 2000) return [];
  return value.flatMap(row => {
    if (!row || typeof row.id !== 'string' || typeof row.name_es !== 'string' && typeof row.name_en !== 'string') return [];
    const image = typeof row.image_url === 'string' && /^https:\/\//.test(row.image_url) ? row.image_url : '/favicon.svg';
    const priceAvailable = Number.isSafeInteger(row.price_cents) && row.price_cents >= 0;
    return [{ id: row.id, name: row[`name_${locale}`] || row.name_es || row.name_en, description: row[`description_${locale}`] || '', type: row.category === 'savory' ? 'savory' : 'sweet', image, thumbnail: image, kind: row.category === 'savory' ? 'PAN SALADO' : 'PAN DULCE', demoPriceCents: priceAvailable ? row.price_cents : 0, priceAvailable, category: row.category, unitsPerCase: Number.isInteger(row.units_per_case) && row.units_per_case > 0 ? row.units_per_case : undefined, enabledB2c: row.enabled_b2c === true, enabledB2b: row.enabled_b2b === true, stockQuantity: row.stock_quantity }];
  });
}
export const canSelectProduct = (product: ShopProduct, type: CustomerType) => product.stockQuantity !== 0 && (type === 'business' ? product.enabledB2b === undefined || product.enabledB2b && Number.isInteger(product.unitsPerCase) && (product.unitsPerCase ?? 0) > 0 : product.enabledB2c !== false && product.priceAvailable !== false);
export function sanitizeCart(value: unknown, catalog: ShopProduct[] = shopProducts('en')): Cart {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const valid = new Set<string>(catalog.map(product => product.id));
  return Object.fromEntries(Object.entries(value).filter(([id, quantity]) => valid.has(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99));
}
export function cartLines(cart: Cart, type: CustomerType, locale: Locale, catalog: ShopProduct[] = shopProducts(locale)) {
  return catalog.filter(product => cart[product.id] && canSelectProduct(product, type)).map(product => ({
    ...product, quantity: cart[product.id], unitsPerPack: type === 'business' ? product.unitsPerCase ?? 12 : 1,
  }));
}
export function createPreviewDraft(cart: Cart, type: CustomerType, locale: Locale, fulfillment: 'pickup' | 'delivery', catalog: ShopProduct[] = shopProducts(locale)) {
  const lines = cartLines(sanitizeCart(cart, catalog), type, locale, catalog);
  if (!lines.length) throw new Error('An order draft must contain at least one product.');
  return {
    kind: 'preview' as const, customerType: type, currency: 'USD' as const, fulfillment,
    lines: lines.map(line => ({ catalogId: line.id, quantity: line.quantity, unitsPerPack: line.unitsPerPack })),
    // This is an internal draft, never a GlobalBake payload or a confirmed order.
    globalBakeStatus: 'not-connected' as const,
  };
}
