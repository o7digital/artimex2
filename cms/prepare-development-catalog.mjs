import deployment from './deployment.json' with { type: 'json' };
import { stableId } from './studio/commerce.mjs';
import { catalogCandidate } from './catalog-candidates.mjs';

if (process.env.CMS_ENVIRONMENT !== 'dev' || process.env.PUBLIC_URL !== deployment.directusUrl || !process.env.ADMIN_TOKEN) throw new Error('Use the Artimex Directus dev service variables.');
const apply = process.argv.includes('--apply'), scope = process.argv.includes('--all-food') ? 'all-food' : 'bakery';
async function api(path, method = 'GET', body) {
  const response = await fetch(deployment.directusUrl + path, { method, headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const result = await response.json(); if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(result.errors)}`); return result.data;
}
const items = await api('/items/erp_items?filter[is_report_item][_eq]=true&fields=id,name,is_report_item,globalbake_code,item_type&limit=2000');
const selected = items.map(item => catalogCandidate(item, scope)).filter(Boolean);
const current = await api('/items/commerce_products?fields=id,item,name_es,name_en,status&limit=2000');
console.log(JSON.stringify({ scope, candidates: selected.length, mode: apply ? 'apply' : 'review', names: selected.map(row => row.item.name) }, null, 2));
if (apply) {
  let created = 0, updated = 0;
  for (const candidate of selected) {
    const item = candidate.item, existing = current.find(row => row.item === item.id), id = existing?.id || stableId(`storefront:${item.id}`);
    const merchandising = { status: 'published', enabled_b2c: true, enabled_b2b: true, category: candidate.category, image_url: candidate.image_url, image_illustrative: candidate.image_illustrative };
    if (existing) { await api(`/items/commerce_products/${id}`, 'PATCH', merchandising); updated++; }
    else {
      await api('/items/commerce_products', 'POST', { id, item: item.id, globalbake_sku: item.globalbake_code || null, name_es: item.name, name_en: item.name, description_es: 'Consulta las presentaciones y la disponibilidad de este producto con nuestro equipo.', description_en: 'Ask our team about pack sizes and availability for this product.', source: 'globalbake', ...merchandising }); created++;
    }
    if (scope === 'bakery' && item.item_type === 'unclassified') await api(`/items/erp_items/${item.id}`, 'PATCH', { item_type: 'finished_good' });
  }
  console.log(JSON.stringify({ created, updated, scope, pricesInvented: false, ingredientsPublished: false, checkoutEnabled: false }));
}
