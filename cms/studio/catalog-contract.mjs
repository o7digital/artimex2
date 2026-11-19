// Shared allowlist for the public Studio endpoint and the Vercel proxy.
export const publicProductFields = ['id', 'globalbake_sku', 'name_es', 'name_en', 'description_es', 'description_en', 'category', 'price_cents', 'stock_quantity', 'units_per_case', 'enabled_b2c', 'enabled_b2b', 'image_url', 'image_illustrative'];
export function publicProduct(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return Object.fromEntries(publicProductFields.filter(key => Object.hasOwn(value, key)).map(key => [key, value[key]]));
}
