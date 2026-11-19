import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { InputError, checksum, stableId } from './commerce.mjs';

export const itemKey = name => checksum(`globalbake:report:${name.normalize('NFC').trim()}`);
export const itemId = name => stableId(`erp-item:${itemKey(name)}`);
const clean = value => String(value ?? '').normalize('NFC').trim();
export function readWorkbook(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length > 2 * 1024 * 1024) throw new InputError('El Excel debe pesar menos de 2 MB.', 413);
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [fileURLToPath(new URL('./xlsx-reader.py', import.meta.url))], { stdio: ['pipe', 'pipe', 'pipe'] });
    const chunks = []; let size = 0, finished = false;
    const fail = error => { if (finished) return; finished = true; clearTimeout(timer); child.kill(); reject(error); };
    const timer = setTimeout(() => fail(new InputError('El análisis del Excel superó el tiempo permitido.')), 10000);
    child.on('error', () => fail(new InputError('El lector Excel no está disponible.', 503)));
    child.stdin.on('error', () => {}); child.stderr.resume();
    child.stdout.on('data', chunk => { size += chunk.length; if (size > 6 * 1024 * 1024) fail(new InputError('El informe supera el límite de datos.')); else chunks.push(chunk); });
    child.on('close', code => {
      if (finished) return;
      finished = true; clearTimeout(timer);
      try { const result = JSON.parse(Buffer.concat(chunks).toString()); if (code || result.error) reject(new InputError(result.error || 'Excel inválido.')); else resolve(result); }
      catch { reject(new InputError('No se pudo analizar el Excel.')); }
    });
    child.stdin.end(bytes);
  });
}
export function buildWorkbookPlan(workbook, fileHash) {
  if (!Array.isArray(workbook.rows) || workbook.rows.length > 20000) throw new InputError('Informe Excel inválido.');
  const rows = workbook.rows, blocks = [], metadata = [], printed = new Set();
  let current = null;
  const isLabel = row => /^ingredients\s*:\s*$/i.test(clean(row?.cells?.A));
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index], a = row.cells?.A, b = row.cells?.B;
    if (row.cells?.D?.trim() === 'Printed :') printed.add(clean(row.cells.E));
    if (isLabel(row)) {
      const previous = rows[index - 1];
      if (!previous?.cells?.A || previous.cells.B || isLabel(previous)) throw new InputError(`Producto faltante antes de la fila ${row.row}.`);
      current = { name: clean(previous.cells.A), originalName: previous.cells.A, sourceRow: previous.row, lines: [] };
      if (!current.name || current.name.length > 2000) throw new InputError(`Nombre inválido en fila ${previous.row}.`);
      blocks.push(current); continue;
    }
    if (a && !isLabel(rows[index + 1])) {
      const match = /^\s*(\d{1,3})(?:[.,](\d{1,3}))?\s*%\s*$/.exec(b || '');
      if (!current || !match) throw new InputError(`Fila ${row.row}: composición no reconocida. No se importó nada.`);
      const milli = Number(match[1]) * 1000 + Number((match[2] || '').padEnd(3, '0'));
      if (milli > 100000 || current.lines.length >= 150 || clean(a).length > 2000) throw new InputError(`Porcentaje o componente inválido en fila ${row.row}.`);
      current.lines.push({ name: clean(a), originalName: a, percentage: `${Math.floor(milli / 1000)}.${String(milli % 1000).padStart(3, '0')}`, milli, originalPercentage: b, sourceRow: row.row });
    } else if (!a) metadata.push(row.row);
  }
  if (!blocks.length || blocks.length > 2000) throw new InputError('No se detectaron bloques de producto GlobalBake válidos.');
  const items = new Map(), recipes = new Map(), parentNames = new Set(), componentNames = new Set();
  function addItem(name, role, sourceRow) {
    const key = itemKey(name);
    if (!items.has(key)) items.set(key, { id: itemId(name), source_key: key, internal_code: `ART-${key.slice(0, 12).toUpperCase()}`, name, item_type: 'unclassified', is_report_item: false, is_component: false, source_rows: [] });
    const item = items.get(key); item[role] = true; item.source_rows.push(sourceRow); return item;
  }
  for (const block of blocks) {
    const parent = addItem(block.name, 'is_report_item', block.sourceRow); parentNames.add(block.name);
    for (const line of block.lines) { addItem(line.name, 'is_component', line.sourceRow); componentNames.add(line.name); }
    if (!block.lines.length) continue;
    const composition = checksum(JSON.stringify(block.lines.map(line => [itemKey(line.name), line.milli])));
    const importKey = checksum(`${parent.id}:${composition}`), id = stableId(`erp-recipe:${importKey}`);
    if (!recipes.has(id)) recipes.set(id, { id, item: parent.id, import_key: importKey, composition_hash: composition, total_percentage: (block.lines.reduce((sum, line) => sum + line.milli, 0) / 1000).toFixed(3), line_count: block.lines.length, has_self_reference: block.lines.some(line => itemId(line.name) === parent.id), lines: block.lines.map((line, sort) => ({ id: stableId(`erp-line:${id}:${sort}`), component: itemId(line.name), percentage: line.percentage, source_percentage: line.originalPercentage, source_name: line.originalName, source_row: line.sourceRow, sort })), occurrences: [] });
    recipes.get(id).occurrences.push({ row: block.sourceRow, original_name: block.originalName, line_rows: block.lines.map(line => line.sourceRow) });
  }
  const variants = new Map();
  for (const recipe of recipes.values()) { const list = variants.get(recipe.item) || []; list.push(recipe); variants.set(recipe.item, list); }
  for (const list of variants.values()) list.forEach((recipe, index) => { recipe.variant = index + 1; recipe.has_conflict = list.length > 1; });
  const conflicting = [...variants.entries()].filter(([, list]) => list.length > 1).map(([id]) => [...items.values()].find(item => item.id === id).name);
  const summary = { report_products: parentNames.size, items: items.size, components: componentNames.size, formulations: recipes.size, recipe_lines: [...recipes.values()].reduce((sum, recipe) => sum + recipe.line_count, 0), blocks: blocks.length, duplicate_blocks: blocks.length - parentNames.size - (recipes.size - variants.size), empty_compositions: [...parentNames].filter(name => !variants.has(itemId(name))).length, conflicting_products: conflicting, self_references: [...recipes.values()].filter(recipe => recipe.has_self_reference).length, zero_percentage_lines: [...recipes.values()].flatMap(recipe => recipe.lines).filter(line => Number(line.percentage) === 0).length, missing_skus: items.size, printed_dates: [...printed] };
  return { fileHash, sheet: workbook.sheet, summary, items: [...items.values()], recipes: [...recipes.values()], metadataRows: metadata };
}
export async function parseGlobalBakeWorkbook(bytes) { return buildWorkbookPlan(await readWorkbook(bytes), checksum(bytes)); }
