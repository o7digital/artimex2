import { products, type Locale } from './content';

export type CustomerType = 'personal' | 'business';
export type Cart = Record<string, number>;
export const shopPaths = { en: '/en/shop/', es: '/es/tienda/' };
export const cartKey = (type: CustomerType) => `artimex-shop-preview-v1-${type}`;
// Demonstration merchandising only. Replace with validated ERP SKU/price/pack data.
export const shopProducts = (locale: Locale) => products[locale].map((product, index) => ({
  ...product,
  demoPriceCents: [325, 300, 325, 275, 325, 250, 350, 350, 375, 425, 300, 375][index],
}));
export function sanitizeCart(value: unknown): Cart {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const valid = new Set<string>(products.en.map(product => product.id));
  return Object.fromEntries(Object.entries(value).filter(([id, quantity]) => valid.has(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99));
}
export function cartLines(cart: Cart, type: CustomerType, locale: Locale) {
  return shopProducts(locale).filter(product => cart[product.id]).map(product => ({
    ...product, quantity: cart[product.id], unitsPerPack: type === 'business' ? 12 : 1,
  }));
}
export function createPreviewDraft(cart: Cart, type: CustomerType, locale: Locale, fulfillment: 'pickup' | 'delivery') {
  const lines = cartLines(sanitizeCart(cart), type, locale);
  if (!lines.length) throw new Error('An order draft must contain at least one product.');
  return {
    kind: 'preview' as const, customerType: type, currency: 'USD' as const, fulfillment,
    lines: lines.map(line => ({ catalogId: line.id, quantity: line.quantity, unitsPerPack: line.unitsPerPack })),
    // This is an internal draft, never a GlobalBake payload or a confirmed order.
    globalBakeStatus: 'not-connected' as const,
  };
}
