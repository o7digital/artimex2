import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { buildWorkbookPlan, readWorkbook, itemId } from './gb-workbook.mjs';
import { validateErpItem } from './erp.mjs';
const row = (number, A, B) => ({ row: number, cells: { ...(A ? { A } : {}), ...(B ? { B } : {}) } });

test('one shared identity links products and components; duplicate source blocks retain provenance', () => {
  const plan = buildWorkbookPlan({ sheet: 'Sheet1', rows: [row(1, 'Bread'), row(2, 'Ingredients : '), row(3, 'Flour', '99.9% '), row(4, 'Bag', '0.0% '), row(5, 'Bread'), row(6, 'Ingredients : '), row(7, 'Flour', '99.9% '), row(8, 'Bag', '0.0% '), row(9, 'Flour'), row(10, 'Ingredients : '), row(11, 'Flour', '100.0% '), row(12, 'Label'), row(13, 'Ingredients : ')] }, 'hash');
  assert.equal(plan.items.length, 4); assert.equal(plan.recipes.length, 2);
  assert.equal(plan.summary.duplicate_blocks, 1); assert.equal(plan.summary.empty_compositions, 1);
  const bread = plan.recipes.find(recipe => recipe.item === itemId('Bread'));
  assert.equal(bread.occurrences.length, 2); assert.equal(bread.total_percentage, '99.900');
  assert.equal(bread.lines[1].percentage, '0.000'); assert.equal(bread.lines[0].source_percentage, '99.9% ');
  assert.equal(bread.lines[0].component, itemId('Flour'));
  assert.equal(plan.recipes.find(recipe => recipe.item === itemId('Flour')).has_self_reference, true);
  assert(plan.items.every(item => item.item_type === 'unclassified' && !('globalbake_code' in item) && !('default_unit' in item)));
});
test('conflicting compositions stay separate and no latest or approved recipe is inferred', () => {
  const plan = buildWorkbookPlan({ rows: [row(1, 'Product'), row(2, 'Ingredients :'), row(3, 'Flour', '100.0%'), row(4, 'Product'), row(5, 'Ingredients :'), row(6, 'Flour', '99.8%'), row(7, 'Water', '0.1%')] }, 'hash');
  assert.equal(plan.recipes.length, 2); assert(plan.recipes.every(recipe => recipe.has_conflict));
  assert.deepEqual(plan.summary.conflicting_products, ['Product']);
  assert.equal(plan.recipes[1].total_percentage, '99.900');
  assert(plan.recipes.every(recipe => !recipe.active && !recipe.yield_quantity));
});
test('unrecognized report content and invalid percentages fail before imports', () => {
  assert.throws(() => buildWorkbookPlan({ rows: [row(1, 'Unstructured sheet', 'hello')] }, 'hash'));
  assert.throws(() => buildWorkbookPlan({ rows: [row(1, 'Ingredients :')] }, 'hash'));
  assert.throws(() => buildWorkbookPlan({ rows: [row(1, 'Bread'), row(2, 'Ingredients :'), row(3, 'Flour', '100.1%')] }, 'hash'));
  assert.equal(itemId('0001'), itemId('0001')); assert.notEqual(itemId('0001'), itemId('1'));
});
function workbook(xml) {
  const script = 'import io,sys,zipfile\nb=io.BytesIO()\nwith zipfile.ZipFile(b,"w") as z:\n z.writestr("xl/workbook.xml", \'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Test"/></sheets></workbook>\')\n z.writestr("xl/worksheets/sheet1.xml", sys.stdin.read())\nsys.stdout.buffer.write(b.getvalue())';
  const result = spawnSync('python3', ['-c', script], { input: xml }); assert.equal(result.status, 0); return result.stdout;
}
test('XLSX reader treats cells as values and rejects formulas, DTD, invalid ZIP and oversized archives', async () => {
  const start = '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">', end = '</row></sheetData></worksheet>';
  const read = await readWorkbook(workbook(start + '<c r="A1" t="inlineStr"><is><t>0001 &amp; text</t></is></c>' + end));
  assert.equal(read.rows[0].cells.A, '0001 & text');
  await assert.rejects(readWorkbook(workbook(start + '<c r="A1"><f>HYPERLINK()</f><v>1</v></c>' + end)));
  await assert.rejects(readWorkbook(workbook('<!DOCTYPE worksheet [<!ENTITY x "boom">]>' + start + end)));
  await assert.rejects(readWorkbook(Buffer.from('not an XLSX')));
  await assert.rejects(async () => readWorkbook(Buffer.alloc(2 * 1024 * 1024 + 1)));
});
test('master item changes cannot alter original names, identities or source recipes', () => {
  assert.throws(() => validateErpItem({ name: 'overwrite' })); assert.throws(() => validateErpItem({ item_type: 'invented' }));
  assert.throws(() => validateErpItem({ default_unit: 'made-up' }));
  assert.deepEqual(validateErpItem({ item_type: 'raw_material', default_unit: 'kg', globalbake_code: '00012' }), { item_type: 'raw_material', default_unit: 'kg', globalbake_code: '00012' });
});
