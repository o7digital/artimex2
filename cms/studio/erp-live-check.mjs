// Dev-only verification. Source records are read-only; only QA-owned rows are removed.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { parseGlobalBakeWorkbook } from './gb-workbook.mjs';
import { stableId, checksum } from './commerce.mjs';
import deployment from '../deployment.json' with { type: 'json' };

if (process.env.CMS_ENVIRONMENT !== 'dev' || process.env.PUBLIC_URL !== deployment.directusUrl || !process.argv[2]) throw new Error('Use Artimex dev variables and the original workbook.');
const origin = deployment.studioUrl, cms = deployment.directusUrl;
const bytes = await readFile(process.argv[2]), plan = await parseGlobalBakeWorkbook(bytes);
let cookie = '', browser, qaItem, qaProduct;
async function directus(path, method = 'GET', body) {
  const response = await fetch(cms + path, { method, headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) throw new Error(`Directus ${method} ${path}: ${response.status}`);
  return response.status === 204 ? null : (await response.json()).data;
}
async function api(path, method = 'GET', body) {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  const result = await response.json(); if (!response.ok) throw new Error(`${path}: ${response.status} ${result.error}`); return result;
}
try {
  assert.equal((await fetch(origin + '/api/erp/items')).status, 401);
  await api('/api/login', 'POST', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  const job = (await api(`/api/erp/imports/${stableId(`erp-import:${plan.fileHash}`)}`)).data;
  assert.equal(job.status, 'completed'); assert.deepEqual(job.summary, plan.summary);
  const masters = await directus('/items/erp_items?fields=id,name,source_key,globalbake_code,default_unit&limit=10000');
  const ids = new Set(masters.map(item => item.id)); assert(plan.items.every(item => ids.has(item.id)));
  const recipes = await directus('/items/erp_recipes?fields=id,item,has_conflict,has_self_reference,total_percentage,yield_quantity,lines.*&limit=10000');
  for (const expected of plan.recipes) {
    const actual = recipes.find(recipe => recipe.id === expected.id); assert(actual);
    assert.equal(actual.item, expected.item); assert.equal(actual.has_self_reference, expected.has_self_reference); assert.equal(actual.has_conflict, expected.has_conflict);
    assert.equal(Number(actual.total_percentage), Number(expected.total_percentage)); assert.equal(actual.yield_quantity, null);
    const lines = actual.lines.sort((a, b) => a.sort - b.sort);
    assert.equal(lines.length, expected.lines.length);
    for (let i = 0; i < lines.length; i++) { assert.equal(lines[i].component, expected.lines[i].component); assert.equal(Number(lines[i].percentage), Number(expected.lines[i].percentage)); assert.equal(lines[i].source_percentage, expected.lines[i].source_percentage); assert.equal(lines[i].source_row, expected.lines[i].source_row); assert.equal(lines[i].quantity, null); }
  }
  const source = await fetch(cms + `/assets/${job.source_file}`, { headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` } }); assert.equal(source.status, 200); assert.equal(checksum(Buffer.from(await source.arrayBuffer())), plan.fileHash);
  assert.equal((await fetch(cms + `/assets/${job.source_file}`)).status, 403);
  for (const collection of ['erp_items', 'erp_recipes', 'erp_recipe_lines', 'erp_recipe_sources', 'erp_imports']) {
    assert.equal((await fetch(cms + `/items/${collection}`, { headers: { Authorization: `Bearer ${process.env.STOREFRONT_READ_TOKEN}` } })).status, 403);
  }
  const stats = await api('/api/erp/overview'); assert(stats.items >= plan.summary.items); assert(stats.formulations >= plan.summary.formulations); assert.equal(stats.executableRecipes, false);
  const replay = await api('/api/erp/workbook/commit', 'POST', { filename: 'gb-products.xlsx', base64: bytes.toString('base64') }); assert.equal(replay.job, job.id); assert.equal(replay.status, 'completed');
  qaItem = randomUUID();
  await directus('/items/erp_items', 'POST', { id: qaItem, internal_code: `QA-${qaItem.slice(0, 10)}`, source_key: `qa:${qaItem}`, name: `QA shared ${qaItem}`, item_type: 'finished_good', globalbake_code: `QA-${qaItem}`, notes: 'PRIVATE-QA-ERP-NOTE' });
  const draft = await api(`/api/erp/items/${qaItem}/storefront`, 'POST', {}); qaProduct = draft.product;
  const linked = await directus(`/items/commerce_products/${qaProduct}`); assert.equal(linked.item, qaItem); assert.equal(linked.status, 'draft'); assert.equal(linked.enabled_b2c, false);
  const repeated = await api(`/api/erp/items/${qaItem}/storefront`, 'POST', {}); assert.equal(repeated.product, qaProduct);
  await api(`/api/products/${qaProduct}`, 'PATCH', { status: 'published' });
  const catalog = await fetch(origin + '/catalog').then(response => response.json()); const publicRow = catalog.products.find(item => item.id === qaProduct); assert(publicRow); assert(!('item' in publicRow)); assert(!JSON.stringify(catalog).includes('PRIVATE-QA-ERP-NOTE'));
  await directus(`/items/commerce_products/${qaProduct}`, 'DELETE'); qaProduct = null;
  await directus(`/items/erp_items/${qaItem}`, 'DELETE'); qaItem = null;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext(); await context.addCookies([{ name: 'artimex_studio', value: cookie.slice(15), url: origin, httpOnly: true, secure: true, sameSite: 'Strict' }]);
  const page = await context.newPage(), errors = [], csp = [];
  page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error' && /content security|refused/i.test(message.text())) csp.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(origin); await page.locator('[data-nav="items"]').waitFor(); await page.waitForFunction(() => !document.querySelector('#page .loading'));
  assert.equal(await page.locator('.stats .stat').first().locator('strong').textContent(), String(stats.items));
  await mkdir('cms/.local/qa', { recursive: true }); await page.screenshot({ path: 'cms/.local/qa/erp-overview.png', fullPage: true });
  await page.locator('[data-nav="items"]').click(); await page.locator('#erp-search').waitFor(); await page.locator('#erp-search input').fill(plan.items[0].name); await page.locator('#erp-search button').click(); await page.locator('tr').filter({ has: page.getByText(plan.items[0].name, { exact: true }) }).locator('[data-component]').first().click(); await page.locator('#erp-item-form').waitFor();
  assert.equal(await page.locator('#erp-item-form [name=default_unit]').inputValue(), ''); await page.locator('#close-editor').click();
  await page.locator('[data-nav="recipes"]').click(); await page.locator('#recipe-search').waitFor(); await page.locator('#recipe-search input').fill(plan.summary.conflicting_products[0]); await page.locator('#recipe-search button').click(); await page.locator('tr').filter({ has: page.getByText(plan.summary.conflicting_products[0], { exact: true }) }).locator('[data-recipe]').first().click(); await page.locator('.composition-summary').waitFor(); assert((await page.locator('#editor').textContent()).includes('distintas composiciones'));
  await page.screenshot({ path: 'cms/.local/qa/erp-recipe.png', fullPage: true }); await page.locator('#close-editor').click();
  await page.locator('[data-nav="workbook"]').click(); await page.locator('#workbook-file').setInputFiles(process.argv[2]); await page.locator('#workbook-commit').waitFor(); assert((await page.locator('#workbook-preview').textContent()).includes(String(plan.summary.formulations)));
  await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#menu-toggle').click(); await page.locator('[data-nav="overview"]').click(); await page.waitForFunction(() => !document.querySelector('#page .loading')); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: 'cms/.local/qa/erp-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 800 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []); assert.deepEqual(csp, []);
  console.log('ERP live QA passed: all source items, recipe lines and percentages verified; source hash, replay, private permissions, shared commerce identity, charts, search, conflicts, XLSX UI and mobile verified.');
} finally {
  if (browser) await browser.close();
  if (qaProduct) await directus(`/items/commerce_products/${qaProduct}`, 'DELETE').catch(() => {});
  if (qaItem) await directus(`/items/erp_items/${qaItem}`, 'DELETE').catch(() => {});
}
