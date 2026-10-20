import { test, expect } from '@playwright/test';
import { sanitizeCart, createPreviewDraft } from '../src/data/commerce';

for (const [locale, path, width] of [['en', '/en/shop/', 1440], ['es', '/es/tienda/', 390]]) {
  test(`Personal shopping, filters and local checkout in ${locale}`, async ({ page }) => {
    const errors = [];
    const posts = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() === 'POST') posts.push(request.url()); });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    await expect(page.locator('.shop-products article')).toHaveCount(12);
    const filters = page.locator('.shop-filters button');
    await filters.nth(1).click();
    await expect(page.locator('.shop-products article')).toHaveCount(4);
    await filters.first().click();
    await page.locator('input[type="search"]').fill('no such bread');
    await expect(page.locator('.shop-products article')).toHaveCount(0);
    await page.locator('.shop-no-results button').click();
    await expect(page.locator('.shop-products article')).toHaveCount(12);
    await page.locator('.shop-add').first().click();
    await page.locator('.shop-add').first().click();
    await expect(page.locator('.shop-quantity output')).toHaveText('2');
    await expect(page.locator('.shop-cart-summary strong')).toHaveText('$6.50');
    await page.locator('.shop-quantity button').first().click();
    await expect(page.locator('.shop-cart-summary strong')).toHaveText('$3.25');
    await page.reload();
    await expect(page.locator('.shop-quantity output')).toHaveText('1');
    await page.locator('.shop-checkout').click();
    const dialog = page.locator('.shop-dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('[name="name"]').fill('Demo Buyer');
    await dialog.locator('[name="email"]').fill('demo@example.com');
    await dialog.locator('[value="delivery"]').check();
    await expect(dialog.locator('[name="address"]')).toHaveAttribute('required', '');
    await dialog.locator('[name="address"]').fill('Example address');
    await dialog.locator('button[type="submit"]').click();
    await expect(page.locator('.shop-preview-result')).toBeVisible();
    await expect(page.locator('.shop-preview-result')).toContainText(locale === 'en' ? 'No order has been placed' : 'No se ha realizado ningún pedido');
    await expect(page.locator('#shop-checkout-title')).toBeFocused();
    expect(posts).toEqual([]);
    await dialog.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('.shop-checkout')).toBeFocused();
    await page.locator('.shop-remove').click();
    await expect(page.locator('.shop-empty')).toBeVisible();
    await expect(page.locator('.shop-checkout')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    expect(errors).toEqual([]);
  });
}

test('B2B cases stay separate, persist across languages and require company details', async ({ page }) => {
  await page.goto('/en/shop/?customer=business');
  await expect(page.locator('.shop-mode-buttons button').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.shop-add').first().click();
  await expect(page.locator('.shop-count')).toHaveText('1 case');
  await expect(page.locator('.shop-cart-summary')).toContainText('12 pieces in total');
  await expect(page.locator('.shop-cart-summary')).not.toContainText('$');
  await page.locator('.shop-mode-buttons button').first().click();
  await expect(page.locator('.shop-empty')).toBeVisible();
  await page.locator('.shop-add').nth(1).click();
  await page.locator('.shop-mode-buttons button').nth(1).click();
  await expect(page.locator('.shop-cart-line h3')).toHaveText('Concha Chocolate');
  await page.locator('[data-shop-language]').click();
  await expect(page).toHaveURL(/\/es\/tienda\/\?customer=business$/);
  await expect(page.locator('.shop-quantity output')).toHaveText('1');
  await page.locator('.shop-checkout').click();
  await expect(page.locator('[name="company"]')).toHaveAttribute('required', '');
  await page.locator('[name="name"]').fill('Demo Buyer');
  await page.locator('[name="email"]').fill('demo@example.com');
  await page.locator('[name="company"]').fill('Demo Café');
  await page.locator('.shop-dialog button[type="submit"]').click();
  await expect(page.locator('.shop-preview-result')).toContainText('1 cartón');
  const saved = await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('artimex-shop')).map(key => localStorage.getItem(key)).join(''));
  expect(saved).not.toContain('Demo');
  expect(saved).not.toContain('example.com');
  await page.locator('.shop-dialog').press('Escape');
  await page.locator('.shop-clear').click();
  await page.reload();
  await expect(page.locator('.shop-empty')).toBeVisible();
  await page.locator('.shop-mode-buttons button').first().click();
  await expect(page.locator('.shop-cart-line h3')).toHaveText('Concha blanca');
});

test('Untrusted local cart entries cannot become order lines', async ({ page }) => {
  expect(sanitizeCart({ unknown: 4, 'concha-blanca': -1, mantecadas: 2.5, puerquitos: '3', 'elote-fino': 999 })).toEqual({});
  expect(() => createPreviewDraft({}, 'personal', 'en', 'pickup')).toThrow();
  const draft = createPreviewDraft({ 'concha-blanca': 2 }, 'business', 'en', 'delivery');
  expect(draft).toMatchObject({ kind: 'preview', globalBakeStatus: 'not-connected', lines: [{ catalogId: 'concha-blanca', quantity: 2, unitsPerPack: 12 }] });
  await page.addInitScript(() => localStorage.setItem('artimex-shop-preview-v1-personal', '{broken'));
  await page.goto('/en/shop/');
  await expect(page.locator('.shop-add').first()).toBeEnabled();
  await expect(page.locator('.shop-empty')).toBeVisible();
});

test('Purchase online sits between collection and story in both navigation menus', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('.desktop-nav a').nth(1)).toHaveText('Purchase online');
  await expect(page.locator('.desktop-nav a').nth(2)).toHaveAttribute('href', '#story');
  await expect(page.locator('#mobile-menu a').nth(1)).toHaveAttribute('href', '#order');
  await expect(page.locator('#order .ordering-option')).toHaveCount(2);
  await page.locator('#order .ordering-option').nth(1).click();
  await expect(page).toHaveURL(/\/en\/shop\/\?customer=business$/);
  await expect(page.locator('.shop-mode-buttons button').nth(1)).toHaveAttribute('aria-pressed', 'true');
});
