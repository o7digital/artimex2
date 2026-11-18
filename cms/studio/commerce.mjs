import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export const productFields = ['globalbake_sku', 'name_es', 'name_en', 'description_es', 'description_en', 'category', 'status', 'price_cents', 'stock_quantity', 'units_per_case', 'enabled_b2c', 'enabled_b2b', 'image_url'];
const text = (value, max = 2000) => {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new InputError('Revisa los textos y su longitud.');
  return value.trim();
};
export const stableId = value => {
  const h = createHash('sha256').update(`artimex:${value}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
export const checksum = value => createHash('sha256').update(value).digest('hex');
export function validateProduct(input, creating = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !productFields.includes(key))) throw new InputError('La ficha contiene campos no permitidos.');
  const row = {};
  for (const [key, value] of Object.entries(input)) {
    if (['price_cents', 'stock_quantity', 'units_per_case'].includes(key)) {
      if (value !== null && (!Number.isSafeInteger(value) || value < (key === 'units_per_case' ? 1 : 0) || value > 100000000)) throw new InputError(`Valor inválido: ${key}.`);
      row[key] = value;
    } else if (key.startsWith('enabled_')) {
      if (typeof value !== 'boolean') throw new InputError('Selecciona los canales de venta.');
      row[key] = value;
    } else row[key] = text(value ?? '', key.startsWith('description_') ? 8000 : 2000);
  }
  if (row.status !== undefined && !['draft', 'published', 'archived'].includes(row.status)) throw new InputError('Estado de producto inválido.');
  if (row.category !== undefined && !['conchas', 'pastries', 'savory', 'other'].includes(row.category)) throw new InputError('Categoría inválida.');
  if (row.globalbake_sku === '') row.globalbake_sku = null;
  if (row.image_url) {
    let url;
    try { url = new URL(row.image_url); } catch { /* handled below */ }
    if (!url || url.protocol !== 'https:' || url.username || url.password) throw new InputError('La fotografía debe tener una URL HTTPS.');
  }
  if (creating && !row.name_es && !row.name_en) throw new InputError('Escribe el nombre del producto.');
  return row;
}
export const customerFields = ['name', 'email', 'company', 'customer_type', 'status', 'globalbake_customer_id', 'delivery_address', 'notes'];
export function validateCustomer(input, creating = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !customerFields.includes(key))) throw new InputError('La ficha contiene campos no permitidos.');
  const row = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, text(value ?? '', key === 'notes' ? 8000 : 2000)]));
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) throw new InputError('Revisa el correo electrónico.');
  if (row.customer_type && !['personal', 'business'].includes(row.customer_type)) throw new InputError('Tipo de cliente inválido.');
  if (row.status && !['pending', 'approved', 'archived'].includes(row.status)) throw new InputError('Estado de cliente inválido.');
  if (creating && (!row.name || !row.email)) throw new InputError('Nombre y correo son obligatorios.');
  if (row.globalbake_customer_id === '') row.globalbake_customer_id = null;
  return row;
}

const aliases = {
  globalbake_sku: ['sku', 'productcode', 'product_code', 'itemcode', 'item_code', 'codigo', 'code', 'productid'],
  name_es: ['description', 'productname', 'name', 'nombre', 'descripcion', 'product_description'],
  name_en: ['name_en', 'englishname', 'english_name'],
  price_cents: ['price', 'unitprice', 'unit_price', 'precio', 'sellingprice'],
  stock_quantity: ['stock', 'quantity', 'onhand', 'stockonhand', 'existencia', 'available'],
  units_per_case: ['packsize', 'pack_size', 'unitspercase', 'units_per_case', 'caseqty', 'piezasporcaja'],
};
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
export function readCsv(csv, delimiter) {
  if (typeof csv !== 'string' || Buffer.byteLength(csv) > 2 * 1024 * 1024) throw new InputError('El CSV debe pesar menos de 2 MB.', 413);
  if (!csv.trim()) throw new InputError('El CSV está vacío.');
  const first = csv.split(/\r?\n/, 1)[0];
  const selected = delimiter || (first.split(';').length > first.split(',').length ? ';' : ',');
  if (![',', ';', '\t'].includes(selected)) throw new InputError('Separador CSV inválido.');
  let data;
  try { data = parse(csv, { bom: true, delimiter: selected, skip_empty_lines: true, max_record_size: 40000 }); }
  catch { throw new InputError('No se pudo leer el CSV. Revisa comillas, columnas y separador.'); }
  const headers = data.shift()?.map(value => value.trim());
  if (!headers?.length || headers.some(value => !value) || new Set(headers).size !== headers.length || headers.length > 80) throw new InputError('Los encabezados deben ser únicos, no vacíos y como máximo 80.');
  if (!data.length || data.length > 2000) throw new InputError('Importa entre 1 y 2.000 productos por archivo.');
  const suggested = {};
  for (const [field, names] of Object.entries(aliases)) {
    const match = headers.find(header => normalize(header) === normalize(field) || names.some(name => normalize(name) === normalize(header)));
    if (match) suggested[field] = match;
  }
  return { headers, rows: data.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))), suggested, delimiter: selected };
}
function numberCell(value, cents = false) {
  if (value === '' || value === undefined) return undefined;
  const raw = String(value).trim();
  // Explicit decimal point or comma; thousands separators are intentionally rejected.
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw)) throw new InputError('Usa números sin separador de miles.');
  const amount = Number(raw.replace(',', '.')) * (cents ? 100 : 1);
  const result = Math.round(amount);
  if ((!cents && amount !== result) || !Number.isSafeInteger(result) || result > 100000000) throw new InputError('Cantidad o precio inválido.');
  return result;
}
export function previewImport(csv, mapping, options = {}) {
  const parsed = readCsv(csv, options.delimiter);
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) throw new InputError('Selecciona las columnas del CSV.');
  const allowed = ['globalbake_sku', 'name_es', 'name_en', 'price_cents', 'stock_quantity', 'units_per_case'];
  if (Object.entries(mapping).some(([key, column]) => !allowed.includes(key) || !parsed.headers.includes(column))) throw new InputError('Mapeo de columnas inválido.');
  if (!mapping.globalbake_sku || (!mapping.name_es && !mapping.name_en)) throw new InputError('Selecciona una columna SKU y al menos un nombre.');
  if (new Set(Object.values(mapping)).size !== Object.values(mapping).length) throw new InputError('Cada columna debe usarse una sola vez.');
  if (mapping.price_cents && options.priceUnit !== 'usd') throw new InputError('Confirma que la columna de precios contiene dólares USD.');
  if (mapping.stock_quantity && options.stockUnit !== 'piece') throw new InputError('Confirma que las existencias están expresadas en piezas.');
  const seen = new Set();
  const rows = parsed.rows.map((source, index) => {
    try {
      const sourceSku = source[mapping.globalbake_sku]?.trim();
      if (!sourceSku || sourceSku.length > 120) throw new InputError('SKU faltante o demasiado largo.');
      if (seen.has(sourceSku)) throw new InputError('SKU duplicado en el archivo.');
      seen.add(sourceSku);
      const row = {};
      for (const [field, column] of Object.entries(mapping)) {
        const cell = source[column]?.trim();
        if (['price_cents', 'stock_quantity', 'units_per_case'].includes(field)) {
          const number = numberCell(cell, field === 'price_cents');
          if (number !== undefined) row[field] = number;
        } else if (cell) row[field] = cell;
      }
      const product = validateProduct(row, true);
      return { line: index + 2, product, valid: true };
    } catch (error) { return { line: index + 2, valid: false, error: error.message }; }
  });
  return { headers: parsed.headers, count: rows.length, valid: rows.filter(row => row.valid).length, invalid: rows.filter(row => !row.valid).length, rows, checksum: checksum(csv) };
}
export function inspectXml(xml) {
  if (typeof xml !== 'string' || Buffer.byteLength(xml) > 1024 * 1024) throw new InputError('El XML debe pesar menos de 1 MB.', 413);
  if (!xml.trim() || /<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) throw new InputError('XML vacío o con declaraciones DTD/entidades no permitidas.');
  if (XMLValidator.validate(xml) !== true) throw new InputError('El archivo no es un XML válido.');
  let document;
  try { document = new XMLParser({ ignoreAttributes: false, processEntities: false, parseTagValue: false, parseAttributeValue: false }).parse(xml); }
  catch { throw new InputError('No se pudo analizar el XML.'); }
  const roots = Object.keys(document).filter(key => !key.startsWith('?'));
  if (roots.length !== 1) throw new InputError('El XML debe contener un solo elemento raíz.');
  const paths = new Set();
  function walk(value, path, depth) {
    if (depth > 20) throw new InputError('El XML supera la profundidad permitida.');
    if (paths.size > 250) return;
    paths.add(path);
    if (Array.isArray(value)) { for (const item of value.slice(0, 3)) walk(item, `${path}[]`, depth + 1); }
    else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) walk(item, `${path}/${key}`, depth + 1);
  }
  walk(document[roots[0]], roots[0], 0);
  return { root: roots[0], paths: [...paths].slice(0, 250), checksum: checksum(xml), compatible: false, message: 'Estructura analizada. La compatibilidad GlobalBake requiere validar su contrato XML, transporte y confirmaciones.' };
}

export function makeOrder(input, products, customer) {
  if (!input || !Array.isArray(input.lines) || !input.lines.length || input.lines.length > 100) throw new InputError('Selecciona entre 1 y 100 líneas.');
  if (!customer || customer.status !== 'approved') throw new InputError('Selecciona un cliente aprobado.');
  if (!['pickup', 'delivery'].includes(input.fulfillment)) throw new InputError('Selecciona el modo de entrega.');
  if (input.fulfillment === 'delivery' && !String(input.delivery_address || customer.delivery_address || '').trim()) throw new InputError('Indica la dirección de entrega.');
  const seen = new Set();
  const lines = input.lines.map(line => {
    if (!line || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 999 || seen.has(line.product)) throw new InputError('Cantidades inválidas o productos duplicados.');
    seen.add(line.product);
    const product = products.find(item => item.id === line.product);
    if (!product || product.status === 'archived' || !Number.isSafeInteger(product.price_cents) || product.price_cents < 0) throw new InputError('Confirma el precio de cada producto antes de crear el borrador.');
    if (customer.customer_type === 'business') throw new InputError('Los precios B2B negociados todavía no están configurados.');
    const total = product.price_cents * line.quantity;
    if (!Number.isSafeInteger(total) || total > 100000000) throw new InputError('El importe supera el límite permitido.');
    return { product: product.id, sku_snapshot: product.globalbake_sku, name_snapshot: product.name_es || product.name_en, quantity: line.quantity, unit_price_cents: product.price_cents, units_per_pack: 1, line_total_cents: total };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.line_total_cents, 0);
  if (subtotal > 100000000) throw new InputError('El subtotal supera el límite permitido.');
  return { customer: customer.id, customer_type: customer.customer_type, fulfillment: input.fulfillment, delivery_address: text(input.delivery_address || customer.delivery_address || ''), notes: text(input.notes || '', 8000), status: 'draft', currency: 'USD', subtotal_cents: subtotal, payment_status: 'unpaid', erp_status: 'blocked', lines };
}
