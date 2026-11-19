import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogCandidate } from '../catalog-candidates.mjs';
const item = name => ({ id: 'id', name, is_report_item: true });
test('development bakery selection excludes raw materials, packaging and ERP-only components', () => {
  for (const name of ['Flour Bulk 50#', 'White Label 4x6 Roll 1000ct', 'Box Charge', 'Freight Charge Tamal Oaxaqueno', 'New Pan Molido Milanesa 3/3lbs Tray', 'Artimex Masa Salada', 'Salsa Roja 4 Bags/8 Lbs Tray']) assert.equal(catalogCandidate(item(name)), null);
  assert.equal(catalogCandidate({ ...item('Concha Blanca 72/5oz'), is_report_item: false }), null);
  assert.equal(catalogCandidate(item('Concha Blanca 72/5oz')).category, 'conchas');
  assert.equal(catalogCandidate(item('Chicken Empanadas EGG 70/3oz')).category, 'savory');
  assert.equal(catalogCandidate(item('Galletas Grajeas 144/2.7oz')).image_illustrative, false);
});
test('broader food scope remains explicit and carries no ingredient data into merchandising', () => {
  const candidate = catalogCandidate(item('Tamal Chicken 95/5oz'), 'all-food'); assert(candidate);
  assert.equal(candidate.category, 'savory');
  assert(!('ingredients' in candidate)); assert(!('percentage' in candidate)); assert(!('price_cents' in candidate));
  assert.equal(catalogCandidate(item('Milk Tote 1 Case - 6 Gln'), 'all-food'), null);
});
