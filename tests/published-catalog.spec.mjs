import { test, expect } from '@playwright/test';
test.skip(!process.env.LIVE_CATALOG_CHECK, 'Run explicitly against the connected development preview.');

for (const [locale, path] of [['en', '/en/'], ['es', '/es/']]) {
  test(`GlobalBake products are present in the initial homepage HTML and remain private by field in ${locale}`, async ({ page, request }) => {
    const catalog = await request.get('/api/commerce/catalog'); expect(catalog.ok()).toBe(true);
    const data = await catalog.json(); expect(data.products.length).toBeGreaterThan(12); expect(data.checkoutEnabled).toBe(false);
    for (const product of data.products) {
      for (const key of ['ingredients', 'recipes', 'percentage', 'lines', 'source_percentage', 'item', 'notes', 'source_file']) expect(product).not.toHaveProperty(key);
    }
    const response = await request.get(path); const html = await response.text();
    const example = data.products.find(product => !/[&<>"']/.test(product[`name_${locale}`]));
    expect(html).toContain(example[`name_${locale}`]);
    await page.goto(path + '#collection');
    await expect(page.locator('.collection-search')).toBeVisible();
    await expect(page.locator('.product-card')).toHaveCount(data.products.length);
    await expect(page.locator('.collection-search small')).toContainText(String(data.products.length));
    const search = page.locator('.collection-search input'); await search.fill(example[`name_${locale}`]);
    await expect(page.locator('.product-card:visible')).toHaveCount(1);
    await page.locator('.product-card:visible .product-image-button').click();
    await expect(page.locator('.product-dialog h2')).toHaveText(example[`name_${locale}`]);
    await expect(page.locator('.product-dialog')).not.toContainText('Ingredients');
    await expect(page.locator('.product-dialog')).not.toContainText('Ingredientes');
    await page.locator('.product-dialog').press('Escape');
    await search.fill('');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}
test('connected shop lists the source variants without invented prices or live ordering', async ({ page, request }) => {
  const data = await (await request.get('/api/commerce/catalog')).json();
  await page.goto('/en/shop/');
  await expect(page.locator('.shop-products article')).toHaveCount(data.products.filter(product => product.enabled_b2c).length);
  await expect(page.locator('.shop-products')).not.toContainText('$0.00');
  const missingPrice = data.products.find(product => product.enabled_b2c && product.price_cents === null);
  if (missingPrice) {
    const row = page.locator('.shop-product').filter({ has: page.getByRole('heading', { name: missingPrice.name_en, exact: true }) });
    await expect(row.locator('.shop-product-price')).toContainText('Price on request');
    await expect(row.locator('.shop-add')).toBeDisabled();
    await expect(row.locator('.shop-inquire')).toHaveAttribute('href', /^mailto:sales@artimex\.com/);
  }
  await page.locator('.shop-mode-buttons button').nth(1).click();
  await expect(page.locator('.shop-products article')).toHaveCount(data.products.filter(product => product.enabled_b2b).length);
  await expect(page.locator('.shop-preview')).toContainText('no orders or payments');
});
