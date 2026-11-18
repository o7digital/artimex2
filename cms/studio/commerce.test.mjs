import test from 'node:test';
import assert from 'node:assert/strict';
import { readCsv, previewImport, inspectXml, validateProduct, validateCustomer, makeOrder, stableId } from './commerce.mjs';

test('CSV keeps SKU leading zeros, quoted newlines, accents and monetary precision', () => {
  const csv = '\ufeffCode;Description;Price;Stock;PackSize\r\n00071;"Concha\nchocolaté";3,25;14;12\r\n00072;Telera;0,10;0;6';
  const parsed = readCsv(csv);
  assert.equal(parsed.rows[0].Code, '00071');
  assert.equal(parsed.suggested.globalbake_sku, 'Code');
  const preview = previewImport(csv, parsed.suggested, { priceUnit: 'usd', stockUnit: 'piece' });
  assert.equal(preview.invalid, 0);
  assert.equal(preview.rows[0].product.price_cents, 325);
  assert.equal(preview.rows[1].product.price_cents, 10);
  assert.equal(preview.rows[1].product.stock_quantity, 0);
  assert.equal(preview.rows[0].product.name_es, 'Concha\nchocolaté');
});
test('import rejects duplicate SKUs, duplicate headers, ambiguous numbers and unconfirmed prices', () => {
  assert.throws(() => readCsv('SKU,SKU\n1,2'));
  assert.throws(() => previewImport('SKU,Name,Price\n1,A,3', { globalbake_sku: 'SKU', name_es: 'Name', price_cents: 'Price' }));
  assert.throws(() => previewImport('SKU,Name\n1,A', { globalbake_sku: 'SKU', name_es: 'SKU' }));
  const result = previewImport('SKU;Name;Price\n1;A;1.234,56\n1;B;2', { globalbake_sku: 'SKU', name_es: 'Name', price_cents: 'Price' }, { priceUnit: 'usd' });
  assert.equal(result.invalid, 2);
  assert.throws(() => readCsv('A,B\n1,2,3'));
});
test('unmapped and blank imported fields are absent, preserving existing editorial data', () => {
  const result = previewImport('SKU,Name,Price\n00001,Concha,', { globalbake_sku: 'SKU', name_es: 'Name', price_cents: 'Price' }, { priceUnit: 'usd' });
  assert.deepEqual(result.rows[0].product, { globalbake_sku: '00001', name_es: 'Concha' });
  assert.equal(stableId('sku:00001'), stableId('sku:00001'));
  assert.notEqual(stableId('sku:00001'), stableId('sku:1'));
});
test('product and customer input is allowlisted and cannot write privileged fields', () => {
  assert.throws(() => validateProduct({ name_es: 'Concha', source: 'globalbake' }, true));
  assert.throws(() => validateProduct({ stock_quantity: -1 }));
  assert.throws(() => validateProduct({ price_cents: 3.25 }));
  assert.throws(() => validateProduct({ image_url: 'javascript:alert(1)' }));
  assert.throws(() => validateProduct({ units_per_case: 0 }));
  assert.throws(() => validateCustomer({ name: 'Buyer', email: 'invalid' }, true));
  assert.deepEqual(validateProduct({ price_cents: null, stock_quantity: 0 }), { price_cents: null, stock_quantity: 0 });
});
test('XML analysis rejects DTD/XXE and malformed documents and never claims ERP compatibility', () => {
  assert.throws(() => inspectXml('<!DOCTYPE x [<!ENTITY attack SYSTEM "file:///etc/passwd">]><x>&attack;</x>'));
  assert.throws(() => inspectXml('<x><a></x>'));
  assert.throws(() => inspectXml('<a/><b/>'));
  const result = inspectXml('<Sample><Item sku="0001"><Name>Private name</Name></Item></Sample>');
  assert.equal(result.compatible, false);
  assert.equal(result.root, 'Sample');
  assert(result.paths.includes('Sample/Item/@_sku'));
  assert(!JSON.stringify(result).includes('Private name'));
  assert.throws(() => inspectXml('<n>'.repeat(25) + '</n>'.repeat(25)));
});
test('order draft totals use authoritative cents and cannot enable payment or ERP export', () => {
  const customer = { id: stableId('customer'), status: 'approved', customer_type: 'personal' };
  const product = { id: stableId('product'), status: 'draft', price_cents: 325, name_es: 'Concha', globalbake_sku: '0001' };
  const input = { lines: [{ product: product.id, quantity: 3, price_cents: 1 }], fulfillment: 'pickup', subtotal_cents: 1, payment_status: 'paid', erp_status: 'acknowledged' };
  const draft = makeOrder(input, [product], customer);
  assert.equal(draft.subtotal_cents, 975);
  assert.equal(draft.lines[0].unit_price_cents, 325);
  assert.equal(draft.status, 'draft'); assert.equal(draft.payment_status, 'unpaid'); assert.equal(draft.erp_status, 'blocked');
  assert.throws(() => makeOrder(input, [product], { ...customer, status: 'pending' }));
  assert.throws(() => makeOrder(input, [product], { ...customer, customer_type: 'business' }));
  assert.throws(() => makeOrder(input, [{ ...product, price_cents: null }], customer));
  assert.throws(() => makeOrder({ ...input, lines: [...input.lines, ...input.lines] }, [product], customer));
  assert.throws(() => makeOrder({ ...input, fulfillment: 'delivery' }, [product], customer));
});
