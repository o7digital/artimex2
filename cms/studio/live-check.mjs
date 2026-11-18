// Explicit dev-only integration check. Creates and deletes its own QA records.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { stableId } from './commerce.mjs';

const origin = process.env.STUDIO_TEST_URL || 'https://studio-dev-037f6348.up.railway.app';
const cms = process.env.PUBLIC_URL;
if (process.env.CMS_ENVIRONMENT !== 'dev' || !cms || !process.env.ADMIN_TOKEN || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL) throw new Error('Run with Artimex Directus dev variables only.');
const prefix = `QA-${randomUUID().slice(0, 8)}`;
const cleanup = { products: [], customers: [], orders: [], imports: [] };
let cookie = '', browser;
async function directus(path, method = 'GET', data, token = process.env.ADMIN_TOKEN) {
  const response = await fetch(cms + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(`Directus ${method} ${path}: ${response.status} ${JSON.stringify(payload.errors)}`);
  return payload?.data;
}
async function studio(path, method = 'GET', data) {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  const payload = await response.json();
  if (!response.ok) throw new Error(`Studio ${method} ${path}: ${response.status} ${payload.error}`);
  return payload;
}
try {
  const publicRead = await fetch(cms + '/items/commerce_customers'); assert.equal(publicRead.status, 403);
  await studio('/api/login', 'POST', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  const profile = await studio('/api/me'); assert.equal(profile.email, process.env.ADMIN_EMAIL);
  const overview = await studio('/api/overview'); assert.equal(overview.xmlConnected, false);
  const product = await studio('/api/products', 'POST', { name_es: prefix, name_en: prefix, globalbake_sku: prefix, price_cents: 325, stock_quantity: 25, units_per_case: 24, enabled_b2c: true, enabled_b2b: true, description_es: 'QA editorial', category: 'conchas', status: 'draft' }); cleanup.products.push(product.id);
  const customer = await studio('/api/customers', 'POST', { name: prefix, email: `${prefix.toLowerCase()}@example.com`, status: 'approved', customer_type: 'personal' }); cleanup.customers.push(customer.id);
  const input = { customer: customer.id, fulfillment: 'pickup', idempotency_key: randomUUID(), subtotal_cents: 1, payment_status: 'paid', lines: [{ product: product.id, quantity: 2, price_cents: 1 }] };
  const order = await studio('/api/orders', 'POST', input); cleanup.orders.push(order.id);
  assert.equal(order.subtotal_cents, 650); assert.equal(order.payment_status, 'unpaid'); assert.equal(order.erp_status, 'blocked');
  const repeated = await studio('/api/orders', 'POST', input); assert.equal(repeated.id, order.id);
  const detail = (await studio(`/api/orders/${order.id}`)).data; assert.equal(detail.lines.length, 1); assert.equal(detail.sync_jobs.length, 1); assert.equal(detail.sync_jobs[0].status, 'blocked');
  await studio(`/api/orders/${order.id}`, 'PATCH', { status: 'cancelled' });
  const cancelled = (await studio(`/api/orders/${order.id}`)).data;
  assert.equal(cancelled.status, 'cancelled'); assert.equal(cancelled.sync_jobs[0].status, 'cancelled');
  const xml = await studio('/api/xml/analyze', 'POST', { xml: '<Sample><Item><Code>001</Code></Item></Sample>' }); assert.equal(xml.compatible, false);
  const sku = `${prefix}-CSV`, importedId = stableId(`sku:${sku}`); cleanup.products.push(importedId);
  const importPayload = { filename: `${prefix}.csv`, csv: `SKU;Name;Price;Stock;PackSize\n${sku};CSV ${prefix};4,25;13;24`, mapping: { globalbake_sku: 'SKU', name_es: 'Name', price_cents: 'Price', stock_quantity: 'Stock', units_per_case: 'PackSize' }, options: { delimiter: ';', priceUnit: 'usd', stockUnit: 'piece' } };
  const preview = await studio('/api/imports/preview', 'POST', importPayload); assert.equal(preview.invalid, 0);
  const job = await studio('/api/imports/commit', 'POST', importPayload); cleanup.imports.push(job.job);
  let result;
  for (let count = 0; count < 60; count++) { result = (await studio(`/api/imports/${job.job}`)).data; if (result.status !== 'processing') break; await new Promise(resolve => setTimeout(resolve, 300)); }
  assert.equal(result.status, 'completed'); assert.equal(result.created_count, 1);
  const imported = await directus(`/items/commerce_products/${importedId}`); assert.equal(imported.status, 'draft'); assert.equal(imported.price_cents, 425); assert.equal(imported.units_per_case, 24);
  const again = await studio('/api/imports/commit', 'POST', importPayload); assert.equal(again.job, job.job);
  const sameSku = await directus(`/items/commerce_products?filter[globalbake_sku][_eq]=${sku}`); assert.equal(sameSku.length, 1);
  await studio(`/api/products/${product.id}`, 'PATCH', { status: 'published' });
  const catalog = await fetch(origin + '/catalog').then(response => response.json()); assert(catalog.products.some(row => row.id === product.id)); assert(!catalog.products.some(row => row.id === importedId)); assert(!JSON.stringify(catalog).includes(customer.email)); assert.equal(catalog.checkoutEnabled, false);
  const readerDenied = await fetch(cms + '/items/commerce_customers', { headers: { Authorization: `Bearer ${process.env.STOREFRONT_READ_TOKEN}` } }); assert.equal(readerDenied.status, 403);
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
  await mkdir('cms/.local/qa', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(origin); await page.screenshot({ path: 'cms/.local/qa/artimex-studio-login.png', fullPage: true });
  await context.addCookies([{ name: 'artimex_studio', value: cookie.slice(15), url: origin, httpOnly: true, secure: true, sameSite: 'Strict' }]);
  await page.reload(); await page.locator('[data-nav="products"]').waitFor();
  for (const section of ['overview', 'products', 'customers', 'orders', 'imports', 'sync', 'settings']) { await page.locator(`[data-nav="${section}"]`).click(); await page.waitForFunction(() => !document.querySelector('#page .loading')); assert.equal(await page.locator('#page .error').count(), 0); }
  await page.locator('[data-nav="products"]').click(); await page.locator('#create-item').waitFor();
  const row = page.locator('tr').filter({ has: page.getByText(prefix, { exact: true }) });
  await row.locator('[data-edit]').click(); await page.locator('#editor[open]').waitFor();
  await page.locator('#item-form [name="description_en"]').fill('QA persistence check'); await page.locator('#item-form button[type=submit]').click(); await page.locator('#editor').waitFor({ state: 'hidden' });
  const changed = await directus(`/items/commerce_products/${product.id}`); assert.equal(changed.description_en, 'QA persistence check');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#menu-toggle').click(); await page.locator('[data-nav="overview"]').click(); await page.waitForFunction(() => !document.querySelector('#page .loading'));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: 'cms/.local/qa/artimex-studio-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 800 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.screenshot({ path: 'cms/.local/qa/artimex-studio-dashboard.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Live dev QA passed: authentication, private permissions, authoritative totals, atomic order/lines/queue, idempotency, CSV import/replay, XML analysis, catalog filtering, persistence and responsive Studio.');
} finally {
  if (browser) await browser.close();
  for (const id of cleanup.orders) {
    const detail = await directus(`/items/commerce_orders/${id}?fields=id,lines.id,sync_jobs.id`).catch(() => null);
    for (const row of detail?.lines || []) await directus(`/items/commerce_order_lines/${row.id}`, 'DELETE');
    for (const row of detail?.sync_jobs || []) await directus(`/items/commerce_sync_jobs/${row.id}`, 'DELETE');
    await directus(`/items/commerce_orders/${id}`, 'DELETE').catch(() => {});
  }
  for (const [name, ids] of [['commerce_customers', cleanup.customers], ['commerce_products', cleanup.products], ['commerce_imports', cleanup.imports]]) for (const id of ids) await directus(`/items/${name}/${id}`, 'DELETE').catch(() => {});
  console.log('QA-owned records cleaned up.');
}
