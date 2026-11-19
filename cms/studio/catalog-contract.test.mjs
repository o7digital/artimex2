import test from 'node:test';
import assert from 'node:assert/strict';
import { publicProduct } from './catalog-contract.mjs';
import handler from '../../api/commerce/catalog.js';

test('public product projection drops recipes, percentages, ERP relations and private notes', () => {
  const value = publicProduct({ id: 'public-id', name_es: 'Pan de prueba', price_cents: null, ingredients: ['PRIVATE'], recipes: [{ percentage: 99 }], lines: ['PRIVATE'], item: 'private-erp-id', notes: 'PRIVATE', source_file: 'private-file' });
  assert.deepEqual(value, { id: 'public-id', name_es: 'Pan de prueba', price_cents: null });
  assert.equal(publicProduct(null), null); assert.equal(publicProduct([]), null);
});
test('Vercel catalog applies the same projection and rejects production access to dev data', async () => {
  const previous = { env: process.env.VERCEL_ENV, base: process.env.COMMERCE_STUDIO_URL, fetch: globalThis.fetch };
  let calls = 0, result, status;
  const response = { setHeader() {}, status(value) { status = value; return this; }, json(value) { result = value; return this; } };
  try {
    process.env.VERCEL_ENV = 'preview'; process.env.COMMERCE_STUDIO_URL = 'https://studio.test';
    globalThis.fetch = async () => { calls++; return Response.json({ products: [{ id: 'published', name_en: 'Bread', ingredients: ['PRIVATE'], item: { secret: 'PRIVATE' } }] }); };
    await handler({ method: 'GET' }, response);
    assert.equal(status, 200); assert.deepEqual(result.products, [{ id: 'published', name_en: 'Bread' }]); assert.equal(result.checkoutEnabled, false);
    process.env.VERCEL_ENV = 'production'; calls = 0;
    await handler({ method: 'GET' }, response); assert.equal(status, 503); assert.equal(calls, 0);
  } finally {
    if (previous.env === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous.env;
    if (previous.base === undefined) delete process.env.COMMERCE_STUDIO_URL; else process.env.COMMERCE_STUDIO_URL = previous.base;
    globalThis.fetch = previous.fetch;
  }
});
