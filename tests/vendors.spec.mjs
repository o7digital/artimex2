import { test, expect } from '@playwright/test';
for (const [locale, width] of [['en', 1440], ['es', 390]]) {
  test(`Visible vendor form validates and handles retry in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${locale}/#vendors`);
    await page.locator('.vendors-invitation .button').click();
    const form = page.locator('#vendors-form');
    await expect(form).toBeVisible();
    await expect(form.locator('[name="company"]')).toHaveAttribute('required', '');
    await expect(form.locator('[name="vendor_category"]')).toHaveAttribute('required', '');
    let attempts = 0;
    await page.route('https://formspree.io/f/meaeqdaj', async route => {
      const body = route.request().postData();
      expect(body).toContain(locale === 'en' ? 'Vendor proposal for Artimex' : 'Propuesta de proveedor para Artimex');
      for (const value of ['vendor', 'Demo Supplier', 'ingredients', 'Los Angeles', 'https://example.com/catalog', 'Our flour proposal']) expect(body).toContain(value);
      attempts++;
      await route.fulfill({ status: attempts === 1 ? 422 : 200, contentType: 'application/json', body: attempts === 1 ? '{"errors":[]}' : '{"ok":true}' });
    });
    await form.locator('button[type="submit"]').click();
    expect(attempts).toBe(0);
    await form.locator('[name="name"]').fill('Vendor QA');
    await form.locator('[name="email"]').fill('vendor@example.com');
    await form.locator('[name="company"]').fill('Demo Supplier');
    await form.locator('[name="vendor_category"]').selectOption('ingredients');
    await form.locator('[name="service_area"]').fill('Los Angeles');
    await form.locator('[name="catalog_url"]').fill('https://example.com/catalog');
    await form.locator('[name="message"]').fill('Our flour proposal');
    await form.locator('button[type="submit"]').click();
    await expect(form.getByRole('status')).toHaveAttribute('data-state', 'error');
    await expect(form.locator('[name="company"]')).toHaveValue('Demo Supplier');
    await form.locator('button[type="submit"]').click();
    await expect(form.getByRole('status')).toHaveAttribute('data-state', 'success');
    await expect(form.locator('[name="company"]')).toHaveValue('');
    expect(attempts).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await expect(page.locator('#order')).toHaveCount(0);
  });
}
