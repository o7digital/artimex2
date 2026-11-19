// Additive and repeatable. Run only with the Artimex Railway dev service variables.
import { randomUUID } from 'node:crypto';
import { createErpModel } from './erp-model.mjs';
const url = process.env.PUBLIC_URL || process.env.DIRECTUS_URL;
const token = process.env.ADMIN_TOKEN;
if (process.env.CMS_ENVIRONMENT !== 'dev' || !url || !token || !process.env.STOREFRONT_READ_TOKEN) throw new Error('Use Artimex dev variables: CMS_ENVIRONMENT, PUBLIC_URL, ADMIN_TOKEN, STOREFRONT_READ_TOKEN.');
async function api(path, method = 'GET', data) {
  const response = await fetch(url.replace(/\/$/, '') + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(30000) });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(payload.errors)}`);
  return payload.data;
}
const field = (name, type = 'string', options = {}) => ({
  field: name, type,
  schema: type === 'alias' ? null : { is_nullable: true, ...(type === 'string' ? { max_length: 2000 } : {}), ...options.schema },
  meta: { interface: type === 'text' ? 'input-multiline' : type === 'boolean' ? 'boolean' : type === 'json' ? 'input-code' : 'input', width: 'full', ...options.meta },
});
const choices = (name, values, defaultValue) => field(name, 'string', { schema: { default_value: defaultValue }, meta: { interface: 'select-dropdown', width: 'half', options: { choices: values.map(value => ({ text: value, value })) } } });
const id = () => field('id', 'uuid', { schema: { is_primary_key: true, is_nullable: false }, meta: { hidden: true, special: ['uuid'] } });
const created = () => field('date_created', 'timestamp', { meta: { special: ['date-created'], readonly: true, interface: 'datetime', hidden: true } });
const updated = () => field('date_updated', 'timestamp', { meta: { special: ['date-updated'], readonly: true, interface: 'datetime', hidden: true } });
const count = (name, defaultValue = null) => field(name, 'integer', { schema: { default_value: defaultValue }, meta: { width: 'half' } });
const unique = name => field(name, 'string', { schema: { is_unique: true, max_length: 200 } });
const definitions = {
  commerce_products: { icon: 'bakery_dining', label: 'Productos', template: '{{name_es}} · {{globalbake_sku}}', fields: [
    unique('globalbake_sku'), field('name_es'), field('name_en'), field('description_es', 'text'), field('description_en', 'text'),
    choices('status', ['draft', 'published', 'archived'], 'draft'), choices('category', ['conchas', 'pastries', 'savory', 'other'], 'other'),
    count('price_cents'), count('stock_quantity'), count('units_per_case'),
    field('enabled_b2c', 'boolean', { schema: { default_value: false } }), field('enabled_b2b', 'boolean', { schema: { default_value: false } }),
    field('image_url'), field('image_illustrative', 'boolean', { schema: { default_value: false } }), choices('source', ['manual', 'globalbake'], 'manual'), field('erp_synced_at', 'timestamp'), field('item', 'uuid', { schema: { is_unique: true } }),
  ] },
  commerce_customers: { icon: 'groups', label: 'Clientes', template: '{{name}} · {{company}}', fields: [
    field('name'), field('email'), field('company'), choices('customer_type', ['personal', 'business'], 'personal'),
    choices('status', ['pending', 'approved', 'archived'], 'pending'), unique('globalbake_customer_id'), field('delivery_address', 'text'), field('notes', 'text'),
  ] },
  commerce_orders: { icon: 'receipt_long', label: 'Pedidos', template: '{{number}}', fields: [
    unique('number'), field('customer', 'uuid'), choices('customer_type', ['personal', 'business'], 'personal'),
    choices('status', ['draft', 'cancelled'], 'draft'), choices('fulfillment', ['pickup', 'delivery'], 'pickup'),
    field('delivery_address', 'text'), field('currency', 'string', { schema: { default_value: 'USD', max_length: 3 } }),
    count('subtotal_cents', 0), count('tax_cents'), count('fulfillment_cents'),
    choices('payment_status', ['unpaid', 'pending', 'paid', 'refunded'], 'unpaid'),
    choices('erp_status', ['blocked', 'queued', 'exported', 'acknowledged', 'rejected'], 'blocked'), field('erp_reference'), field('notes', 'text'), field('request_hash'),
  ] },
  commerce_order_lines: { icon: 'list', label: 'Líneas de pedido', template: '{{name_snapshot}}', fields: [
    field('order', 'uuid'), field('product', 'uuid'), field('sku_snapshot'), field('name_snapshot'), count('quantity'), count('unit_price_cents'), count('units_per_pack'), count('line_total_cents'),
  ] },
  commerce_imports: { icon: 'upload_file', label: 'Importaciones GlobalBake', template: '{{filename}}', fields: [
    field('filename'), unique('checksum'), choices('status', ['processing', 'completed', 'partial', 'interrupted'], 'processing'),
    count('row_count', 0), count('created_count', 0), count('updated_count', 0), count('failed_count', 0),
    field('mapping', 'json'), field('report', 'json'), field('completed_at', 'timestamp'),
  ] },
  commerce_sync_jobs: { icon: 'sync_alt', label: 'Intercambios GlobalBake', template: '{{direction}} · {{entity}} · {{status}}', fields: [
    choices('direction', ['import', 'export'], 'export'), choices('entity', ['catalog', 'stock', 'order'], 'order'),
    choices('status', ['blocked', 'pending', 'processing', 'sent', 'acknowledged', 'failed', 'cancelled'], 'blocked'), unique('idempotency_key'),
    field('order', 'uuid'), count('attempts', 0), field('payload', 'json'), field('last_error', 'text'), field('external_reference'), field('acknowledged_at', 'timestamp'),
  ] },
};
const erpModel = createErpModel({ field, choices, count, unique });
Object.assign(definitions, erpModel.definitions);
const existing = await api('/collections');
for (const [name, definition] of Object.entries(definitions)) {
  if (!existing.some(row => row.collection === name)) {
    await api('/collections', 'POST', { collection: name, schema: {}, meta: { icon: definition.icon, display_template: definition.template, translations: [{ language: 'es-ES', translation: definition.label }] }, fields: [id(), created(), updated(), ...definition.fields] });
    console.log('Created', name);
  } else {
    const fields = await api(`/fields/${name}`);
    for (const item of definition.fields) {
      const current = fields.find(row => row.field === item.field);
      if (!current) await api(`/fields/${name}`, 'POST', item);
      else if (item.meta.options?.choices && JSON.stringify(current.meta?.options?.choices) !== JSON.stringify(item.meta.options.choices)) await api(`/fields/${name}/${item.field}`, 'PATCH', { meta: { options: { ...current.meta?.options, choices: item.meta.options.choices } } });
    }
  }
}
const relationships = [
  ['commerce_orders', 'customer', 'commerce_customers'],
  ['commerce_order_lines', 'product', 'commerce_products'],
  ['commerce_order_lines', 'order', 'commerce_orders', 'lines'],
  ['commerce_sync_jobs', 'order', 'commerce_orders', 'sync_jobs'],
  ...erpModel.relationships,
];
const relations = await api('/relations');
for (const [collection, name, related, alias] of relationships) {
  if (alias) {
    const fields = await api(`/fields/${related}`);
    if (!fields.some(row => row.field === alias)) await api(`/fields/${related}`, 'POST', field(alias, 'alias', { meta: { special: ['o2m'], interface: 'list-o2m' } }));
  }
  if (!relations.some(row => row.collection === collection && row.field === name)) await api('/relations', 'POST', { collection, field: name, related_collection: related, schema: { on_delete: 'RESTRICT' }, meta: alias ? { one_field: alias, one_deselect_action: 'nullify' } : {} });
}
await api('/settings', 'PATCH', { project_name: 'Artimex · Commerce', project_color: '#A57840', default_language: 'es-ES', public_note: 'Espacio privado de desarrollo · Artimex Bakery' });
const policies = await api('/policies?limit=-1');
let reader = policies.find(row => row.name === 'Artimex storefront reader');
if (!reader) reader = await api('/policies', 'POST', { name: 'Artimex storefront reader', icon: 'storefront', admin_access: false, app_access: false });
const permissions = await api('/permissions?limit=-1');
// The core plan supports collection read permissions. Publication filtering is
// enforced by the server-only catalogue proxy; this token is never public.
const permission = { policy: reader.id, collection: 'commerce_products', action: 'read', permissions: {}, fields: ['*'] };
const old = permissions.find(row => row.policy === reader.id && row.collection === 'commerce_products' && row.action === 'read');
await api(old ? `/permissions/${old.id}` : '/permissions', old ? 'PATCH' : 'POST', permission);
const roles = await api('/roles?limit=-1');
let role = roles.find(row => row.name === 'Artimex storefront reader');
if (!role) role = await api('/roles', 'POST', { name: 'Artimex storefront reader', icon: 'storefront', policies: [{ policy: reader.id }] });
const users = await api('/users?filter[first_name][_eq]=Artimex%20storefront&limit=1');
if (!users.length) await api('/users', 'POST', { id: randomUUID(), first_name: 'Artimex storefront', role: role.id, status: 'active', token: process.env.STOREFRONT_READ_TOKEN });
if (process.env.ADMIN_EMAIL) {
  const admins = await api(`/users?filter[email][_eq]=${encodeURIComponent(process.env.ADMIN_EMAIL)}&limit=1`);
  if (admins.length && !admins[0].first_name) await api(`/users/${admins[0].id}`, 'PATCH', { first_name: 'Olivier', last_name: 'Steineur' });
}
console.log('Artimex dev schema ready. No products, customers or orders were fabricated.');
