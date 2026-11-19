import { InputError, stableId } from './commerce.mjs';
import { parseGlobalBakeWorkbook } from './gb-workbook.mjs';

const uuid = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
export const itemTypes = ['unclassified', 'finished_good', 'raw_material', 'packaging', 'supply', 'service', 'intermediate'];
export function validateErpItem(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['item_type', 'default_unit', 'notes', 'globalbake_code'].includes(key))) throw new InputError('Campos de artículo no permitidos.');
  const row = { ...input };
  if (row.item_type !== undefined && !itemTypes.includes(row.item_type)) throw new InputError('Tipo de artículo inválido.');
  if (row.default_unit !== undefined && row.default_unit !== null && !['', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'ea', 'case'].includes(row.default_unit)) throw new InputError('Unidad inválida.');
  if (row.globalbake_code !== undefined && row.globalbake_code !== null && (typeof row.globalbake_code !== 'string' || row.globalbake_code.length > 200)) throw new InputError('Código GlobalBake inválido.');
  if (row.notes !== undefined && (typeof row.notes !== 'string' || row.notes.length > 8000)) throw new InputError('Notas demasiado largas.');
  if (row.globalbake_code === '') row.globalbake_code = null;
  if (row.default_unit === '') row.default_unit = null;
  return row;
}
async function prepare(input) {
  if (!input || typeof input.base64 !== 'string' || input.base64.length > 2800000 || !/^[a-zA-Z0-9+/]*={0,2}$/.test(input.base64)) throw new InputError('Archivo Excel inválido o demasiado grande.');
  if (typeof input.filename !== 'string' || input.filename.length > 200 || !/\.xlsx$/i.test(input.filename)) throw new InputError('Selecciona un archivo .xlsx.');
  const bytes = Buffer.from(input.base64, 'base64');
  if (bytes.toString('base64') !== input.base64) throw new InputError('Codificación del archivo inválida.');
  return { bytes, filename: input.filename.replace(/[\\/]/g, '_'), plan: await parseGlobalBakeWorkbook(bytes) };
}
export function createErp({ api }) {
  let queue = Promise.resolve();
  const active = new Set();
  const data = async (path, token, method = 'GET', payload) => (await api(path, token, method, payload)).data;
  async function all(collection, fields, token) {
    const rows = await data(`/items/${collection}?fields=${fields}&limit=10001`, token);
    if (rows.length > 10000) throw new InputError('Este informe supera 10.000 registros; configura paginación antes de ampliarlo.', 422);
    return rows;
  }
  async function batches(collection, rows, token, size = 50) {
    for (let i = 0; i < rows.length; i += size) await data(`/items/${collection}`, token, 'POST', rows.slice(i, i + size));
  }
  async function process(job, plan, token) {
    const progress = { stage: 'items', items: 0, recipes: 0, sources: 0 };
    const save = () => data(`/items/erp_imports/${job}`, token, 'PATCH', { progress });
    try {
      const existing = await all('erp_items', 'id,is_report_item,is_component', token), ids = new Set(existing.map(row => row.id));
      const missing = plan.items.filter(row => !ids.has(row.id)).map(row => ({ ...row, source_import: job }));
      await batches('erp_items', missing, token);
      for (const item of plan.items.filter(row => ids.has(row.id))) {
        const old = existing.find(row => row.id === item.id);
        if (item.is_report_item && !old.is_report_item || item.is_component && !old.is_component) await data(`/items/erp_items/${item.id}`, token, 'PATCH', { is_report_item: old.is_report_item || item.is_report_item, is_component: old.is_component || item.is_component });
      }
      progress.items = plan.items.length; progress.stage = 'recipes'; await save();
      const recipes = await all('erp_recipes', 'id,item,variant,has_conflict', token), recipeIds = new Set(recipes.map(row => row.id));
      const maximum = new Map();
      for (const recipe of recipes) maximum.set(recipe.item, Math.max(maximum.get(recipe.item) || 0, recipe.variant));
      const creates = plan.recipes.filter(row => !recipeIds.has(row.id)).map(({ occurrences, variant, ...recipe }) => {
        const version = (maximum.get(recipe.item) || 0) + 1; maximum.set(recipe.item, version);
        return { ...recipe, variant: version, status: 'imported' };
      });
      // Each recipe and all of its component lines are one nested Directus write.
      await batches('erp_recipes', creates, token, 10);
      const complete = [...recipes, ...creates];
      const counts = new Map(); for (const recipe of complete) counts.set(recipe.item, (counts.get(recipe.item) || 0) + 1);
      for (const recipe of complete) if (counts.get(recipe.item) > 1 && !recipe.has_conflict) await data(`/items/erp_recipes/${recipe.id}`, token, 'PATCH', { has_conflict: true });
      progress.recipes = plan.recipes.length; progress.stage = 'provenance'; await save();
      const previous = new Set((await all('erp_recipe_sources', 'id', token)).map(row => row.id));
      const sources = plan.recipes.map(recipe => ({ id: stableId(`erp-source:${job}:${recipe.id}`), source_import: job, recipe: recipe.id, occurrences: recipe.occurrences }));
      await batches('erp_recipe_sources', sources.filter(row => !previous.has(row.id)), token);
      progress.sources = sources.length; progress.stage = 'completed';
      await data(`/items/erp_imports/${job}`, token, 'PATCH', { status: 'completed', completed_at: new Date().toISOString(), progress, last_error: null });
    } catch (error) {
      await data(`/items/erp_imports/${job}`, token, 'PATCH', { status: 'interrupted', progress, last_error: error.message }).catch(() => {});
    } finally { active.delete(job); }
  }
  async function commit(input, token) {
    const { bytes, filename, plan } = await prepare(input), id = stableId(`erp-import:${plan.fileHash}`);
    const previous = (await data(`/items/erp_imports?filter[id][_eq]=${id}&limit=1`, token))[0];
    if (previous?.status === 'completed' || active.has(id)) return { job: id, status: previous?.status || 'processing', summary: plan.summary };
    active.add(id);
    try {
      const sourceId = stableId(`erp-workbook:${plan.fileHash}`), folderId = stableId('erp-private-sources');
      const files = await data(`/files?filter[id][_eq]=${sourceId}&fields=id&limit=1`, token);
      if (!files.length) {
        const folders = await data(`/folders?filter[id][_eq]=${folderId}&limit=1`, token);
        if (!folders.length) await data('/folders', token, 'POST', { id: folderId, name: 'ERP · Fuentes privadas GlobalBake' });
        const form = new FormData(); form.set('id', sourceId); form.set('folder', folderId); form.set('title', filename);
        form.set('file', new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
        await data('/files', token, 'POST', form);
      }
      const job = { id, filename, file_hash: plan.fileHash, file_size: bytes.length, source_file: sourceId, source_sheet: plan.sheet, status: 'processing', summary: plan.summary, progress: { stage: 'queued', items: 0, recipes: 0, sources: 0 } };
      await data(`/items/erp_imports${previous ? `/${id}` : ''}`, token, previous ? 'PATCH' : 'POST', job);
      queue = queue.then(() => process(id, plan, token)).catch(() => active.delete(id));
      return { job: id, status: 'processing', summary: plan.summary };
    } catch (error) { active.delete(id); throw error; }
  }
  async function overview(token) {
    const [items, recipes, imports, usage] = await Promise.all([
      all('erp_items', 'id,name,item_type,is_report_item,is_component,globalbake_code', token),
      all('erp_recipes', 'id,item,variant,total_percentage,has_conflict,has_self_reference,line_count', token),
      data('/items/erp_imports?limit=5&sort=-date_created&fields=id,filename,status,summary,date_created,completed_at', token),
      data('/items/erp_recipe_lines?aggregate[count]=*&groupBy[]=component&limit=1000', token),
    ]);
    const map = new Map(items.map(item => [item.id, item]));
    const top = usage.map(row => ({ item: row.component, name: map.get(row.component)?.name || 'Componente', count: Number(typeof row.count === 'object' ? row.count['*'] : row.count) })).sort((a, b) => b.count - a.count).slice(0, 8);
    return { items: items.length, report_products: items.filter(row => row.is_report_item).length, components: items.filter(row => row.is_component).length, formulations: recipes.length, unclassified: items.filter(row => row.item_type === 'unclassified').length, missing_skus: items.filter(row => !row.globalbake_code).length, conflicts: new Set(recipes.filter(row => row.has_conflict).map(row => row.item)).size, self_references: recipes.filter(row => row.has_self_reference).length, composition_totals: { below: recipes.filter(row => Number(row.total_percentage) < 100).length, exact: recipes.filter(row => Number(row.total_percentage) === 100).length, above: recipes.filter(row => Number(row.total_percentage) > 100).length }, top_components: top, imports, executableRecipes: false };
  }
  async function handle(path, method, url, token, input) {
    if (path === '/api/erp/overview' && method === 'GET') return overview(token);
    if (path === '/api/erp/workbook/preview' && method === 'POST') { const { plan } = await prepare(input); return { summary: plan.summary, file_hash: plan.fileHash, examples: plan.items.filter(row => row.is_report_item).slice(0, 12).map(row => row.name) }; }
    if (path === '/api/erp/workbook/commit' && method === 'POST') return commit(input, token);
    const match = path.match(/^\/api\/erp\/(items|recipes|imports)(?:\/([a-f\d-]+))?(?:\/(storefront))?$/i);
    if (!match) throw new InputError('Ruta ERP no encontrada.', 404);
    const [, name, id, action] = match, collection = `erp_${name}`;
    if (id && !uuid.test(id)) throw new InputError('Identificador inválido.');
    if (name === 'items' && id && action === 'storefront' && method === 'POST') {
      const item = await data(`/items/erp_items/${id}`, token);
      if (item.item_type !== 'finished_good') throw new InputError('Clasifica primero el artículo como producto terminado.');
      const previous = (await data(`/items/commerce_products?filter[item][_eq]=${id}&limit=1`, token))[0];
      if (previous) return { product: previous.id, created: false };
      const product = await data('/items/commerce_products', token, 'POST', { id: stableId(`storefront:${id}`), item: id, name_es: item.name, globalbake_sku: item.globalbake_code, source: 'globalbake', status: 'draft', enabled_b2c: false, enabled_b2b: false });
      return { product: product.id, created: true };
    }
    if (action) throw new InputError('Acción no permitida.', 405);
    if (name === 'items' && id && method === 'PATCH') return { data: await data(`/items/erp_items/${id}`, token, 'PATCH', validateErpItem(input)) };
    if (method !== 'GET') throw new InputError('Solo lectura para las formulaciones importadas.', 405);
    if (id) {
      const fields = name === 'items' ? '*,recipes.id,recipes.variant,recipes.total_percentage,recipes.has_conflict,recipes.has_self_reference,recipes.line_count,storefronts.id,storefronts.status' : name === 'recipes' ? '*,item.id,item.name,item.internal_code,lines.*,lines.component.id,lines.component.name,lines.component.internal_code,sources.*,sources.source_import.filename,sources.source_import.file_hash' : '*';
      const result = await data(`/items/${collection}/${id}?fields=${fields}${name === 'recipes' ? '&deep[lines][_sort]=sort' : ''}`, token);
      if (name === 'imports' && result.status === 'processing' && !active.has(id)) result.status = 'interrupted';
      return { data: result };
    }
    const page = Math.max(1, Math.min(1000, Number(url.searchParams.get('page')) || 1));
    const params = new URLSearchParams({ limit: '25', page: String(page), meta: 'filter_count', sort: name === 'items' ? 'name' : '-date_created' });
    const search = (url.searchParams.get('search') || '').slice(0, 120), filter = {};
    if (name === 'recipes') { params.set('fields', 'id,variant,status,line_count,total_percentage,has_conflict,has_self_reference,item.id,item.name,item.internal_code'); if (search) filter.item = { name: { _icontains: search } }; }
    else if (search) params.set('search', search);
    if (name === 'items') {
      const scope = url.searchParams.get('scope'), type = url.searchParams.get('type');
      if (scope === 'report') filter.is_report_item = { _eq: true };
      if (scope === 'components') filter.is_component = { _eq: true };
      if (type && itemTypes.includes(type)) filter.item_type = { _eq: type };
    }
    if (Object.keys(filter).length) params.set('filter', JSON.stringify(filter));
    return api(`/items/${collection}?${params}`, token);
  }
  return { handle };
}
