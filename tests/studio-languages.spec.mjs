import { test, expect } from '@playwright/test';
import { createStudioServer } from '../cms/studio/server.mjs';

let server, base;
const itemId = '00000000-0000-4000-a000-000000000001';
const recipeId = '00000000-0000-4000-a000-000000000002';
const product = { id: itemId, name_es: 'Pan dulce', name_en: 'Sweet bread', description_es: 'Texto original', description_en: 'Original text', globalbake_sku: '000123', status: 'published', category: 'pastries', price_cents: null, stock_quantity: null, units_per_case: null, enabled_b2c: true, enabled_b2b: true, image_illustrative: false };
const item = { id: itemId, name: 'Materia prima', internal_code: 'ART-000123', globalbake_code: '000123', item_type: 'raw_material', default_unit: 'kg', notes: 'Notas privadas', is_report_item: true, is_component: true, recipes: [{ id: recipeId, variant: 1, line_count: 1 }], storefronts: [] };
const summary = { report_products: 367, items: 529, formulations: 228, components: 282 };
const source = { id: itemId, filename: 'productos.xlsx', status: 'completed', file_hash: 'abc123', date_created: '2026-11-19T12:00:00Z', summary, progress: { items: 529, recipes: 228, sources: 228 } };
test.use({ locale: 'es-MX' }); // A Spanish browser still starts in English until the user chooses otherwise.
test.beforeAll(async () => {
  server = createStudioServer({ cms: 'http://unused.test', origin: 'http://unused.test', secret: 'language-test-secret'.repeat(3), adminEmail: 'owner@example.com' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });
async function mockApi(page, signedIn = true) {
  const state = { signedIn, writes: [], rejectLogin: false, rejectProduct: false };
  await page.route('**/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    let data = {}, status = 200;
    if (path === '/api/me') { status = state.signedIn ? 200 : 401; data = state.signedIn ? { name: 'Olivier', email: 'owner@example.com', preview: 'https://preview.test', directus: 'https://directus.test' } : { error: 'Inicia sesión para continuar.' }; }
    else if (path === '/api/login') { state.signedIn = !state.rejectLogin; status = state.rejectLogin ? 401 : 200; data = state.rejectLogin ? { error: 'Revisa tus credenciales.' } : { ok: true }; }
    else if (path === '/api/overview') data = { products: 58, published: 58, customers: 0, orders: 0, imports: [] };
    else if (path === '/api/erp/overview') data = { ...summary, unclassified: 47, missing_skus: 529, conflicts: 2, self_references: 110, top_components: [{ item: itemId, name: item.name, count: 2 }], imports: [source] };
    else if (path === '/api/products' || path === `/api/products/${itemId}`) {
      if (request.method() === 'PATCH') { state.writes.push(request.postDataJSON()); status = state.rejectProduct ? 400 : 200; data = state.rejectProduct ? { error: 'Confirma el nombre antes de publicar.' } : product; }
      else data = { data: path.endsWith(itemId) ? product : [product], meta: { filter_count: 1 } };
    }
    else if (path === '/api/erp/items' || path === `/api/erp/items/${itemId}`) data = { data: path.endsWith(itemId) ? item : [item], meta: { filter_count: 1 } };
    else if (path === '/api/erp/recipes') data = { data: [{ id: recipeId, item, variant: 1, line_count: 1, total_percentage: 65.5, has_conflict: true }], meta: { filter_count: 1 } };
    else if (path === `/api/erp/recipes/${recipeId}`) data = { data: { id: recipeId, item, variant: 1, total_percentage: 65.5, has_conflict: true, lines: [{ sort: 0, percentage: 65.5, source_name: item.name, source_percentage: '65.500%', source_row: 7, component: item }], sources: [{ source_import: source, occurrences: [{ row: 7 }] }] } };
    else if (path === '/api/erp/imports') data = { data: [source] };
    else if (path === `/api/erp/imports/${itemId}`) data = { data: source };
    else if (['/api/customers', '/api/orders', '/api/imports', '/api/sync'].includes(path)) data = { data: [], meta: { filter_count: 0 } };
    else if (path === '/api/xml/analyze') data = { root: 'Products', paths: ['Products.Product'], message: 'Estructura analizada. La compatibilidad GlobalBake requiere validar su contrato XML, transporte y confirmaciones.' };
    else throw new Error(`Unexpected mocked request: ${request.method()} ${path}`);
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
  return state;
}
const language = page => page.locator('[data-language]:visible');

test('login defaults to English and remembers an explicit Spanish choice', async ({ page }) => {
  const state = await mockApi(page, false);
  await page.goto(base);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Sign in to Studio' })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await language(page).selectOption('es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('button', { name: 'Entrar al Studio' })).toBeVisible();
  await page.goto(base); // No URL override: preference comes from local storage.
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  state.rejectLogin = true;
  await page.getByLabel('Correo electrónico', { exact: true }).fill('owner@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Entrar al Studio' }).click();
  await expect(page.locator('#login-error')).toHaveText('Revisa tus credenciales.');
  await language(page).selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByLabel('Email address', { exact: true }).fill('owner@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign in to Studio' }).click();
  await expect(page.locator('#login-error')).toHaveText('Check your credentials.');
});

for (const locale of ['en', 'es']) {
  test(`all Studio sections, forms and private ERP data work in ${locale}`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const state = await mockApi(page);
    await page.goto(`${base}/?lang=${locale}`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('#navigation a')).toHaveCount(10);
    await expect(page.locator('#preview-link')).toHaveAttribute('href', locale === 'en' ? 'https://preview.test/en/shop/' : 'https://preview.test/es/tienda/');
    const titles = locale === 'en' ? ['Welcome,', 'Every reference.', 'What makes', 'Preserve.', 'The bread that brings us together.', 'Closer to your customers.', 'What comes next.', 'Every product matters.', 'Your connection to GlobalBake.', 'Your Artimex Studio.'] : ['Bienvenido,', 'Cada referencia.', 'Lo que hace', 'Conservar.', 'El pan que nos une.', 'Cerca de tus clientes.', 'Lo que viene.', 'Cada producto cuenta.', 'El vínculo con GlobalBake.', 'Tu Artimex Studio.'];
    const sections = ['overview', 'items', 'recipes', 'workbook', 'products', 'customers', 'orders', 'imports', 'sync', 'settings'];
    for (const [i, section] of sections.entries()) {
      await page.locator(`#navigation a[href="#${section}"]`).click();
      await expect(page.locator('#page h1')).toContainText(titles[i]);
      if (section === 'items') {
        await page.locator('[data-component]').first().click();
        await expect(page.locator('#editor-title')).toHaveText('Materia prima');
        await expect(page.locator('#editor [name=item_type]')).toHaveValue('raw_material');
        await expect(page.locator('#editor [name=default_unit]')).toHaveValue('kg');
        await expect(page.locator('#editor [name=notes]')).toHaveValue('Notas privadas');
        await expect(page.locator('#editor button[type=submit]')).toHaveText(locale === 'en' ? 'Save classification' : 'Guardar clasificación');
        await page.locator('#close-editor').click();
      }
      if (section === 'recipes') {
        await page.locator('[data-recipe]').first().click();
        await expect(page.locator('#editor')).toContainText('65.500%');
        await expect(page.locator('#editor th').first()).toHaveText(locale === 'en' ? 'Original component' : 'Componente original');
        await expect(page.locator('#editor [data-component]')).toHaveText('Materia prima');
        await page.locator('#close-editor').click();
      }
      if (section === 'workbook') {
        await page.locator('[data-source]').click();
        await expect(page.locator('#editor-title')).toHaveText(locale === 'en' ? 'GlobalBake source' : 'Fuente GlobalBake');
        await expect(page.locator('#editor')).toContainText('productos.xlsx');
        await page.locator('#close-editor').click();
      }
      if (section === 'products') {
        await expect(page.locator('#page tbody')).toContainText('Pan dulce');
        await page.locator('[data-edit]').click();
        await expect(page.locator('#editor [name=name_es]')).toHaveValue('Pan dulce');
        await expect(page.locator('#editor [name=globalbake_sku]')).toHaveValue('000123');
        await expect(page.locator('#editor [name=category]')).toHaveValue('pastries');
        await expect(page.locator('#editor button[type=submit]')).toHaveText(locale === 'en' ? 'Save changes' : 'Guardar cambios');
        state.rejectProduct = true;
        await page.locator('#editor button[type=submit]').click();
        await expect(page.locator('#item-form .error')).toHaveText(locale === 'en' ? 'Confirm the name before publishing.' : 'Confirma el nombre antes de publicar.');
        expect(state.writes[0]).toMatchObject({ name_es: 'Pan dulce', name_en: 'Sweet bread', globalbake_sku: '000123', category: 'pastries', status: 'published', price_cents: null, enabled_b2c: true });
        await page.locator('#close-editor').click();
      }
      if (section === 'customers') {
        await page.locator('#create-item').click();
        await expect(page.locator('#editor [name=customer_type]')).toHaveValue('personal');
        await expect(page.locator('#editor [name=customer_type] option:checked')).toHaveText(locale === 'en' ? 'Retail' : 'Particular');
        await page.locator('#close-editor').click();
      }
      if (section === 'sync') {
        await page.locator('#xml-file').setInputFiles({ name: 'sample.xml', mimeType: 'application/xml', buffer: Buffer.from('<Products/>') });
        await expect(page.locator('#xml-result')).toContainText(locale === 'en' ? 'Structure analyzed.' : 'Estructura analizada.');
      }
    }
    expect(errors).toEqual([]);
  });
}

test('changing language keeps the active section and authenticated workspace on mobile', async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/#products`);
  await expect(page.locator('#page h1')).toHaveText('The bread that brings us together.');
  await language(page).selectOption('es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page).toHaveURL(/#products$/);
  await expect(page.locator('#page h1')).toHaveText('El pan que nos une.');
  await expect(language(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await language(page).selectOption('en');
  await expect(page.locator('#page h1')).toHaveText('The bread that brings us together.');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#studio-view')).toBeVisible();
});
