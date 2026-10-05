import { test, expect } from '@playwright/test';
for (const locale of ['es', 'en']) {
  test(`Inline contact handles failure and successful retry in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`/${locale}/#contact`);
    const form = page.locator('#contact-section-form');
    await expect(form).toHaveAttribute('action', 'https://formspree.io/f/meaeqdaj');
    let submissions = 0;
    await page.route('https://formspree.io/f/meaeqdaj', async route => {
      expect(route.request().method()).toBe('POST');
      expect(route.request().headers().accept).toBe('application/json');
      expect(route.request().postData()).toContain('Contact QA');
      expect(route.request().postData()).toContain('qa@example.com');
      expect(route.request().postData()).toContain('Please send product information.');
      submissions++;
      await route.fulfill({ status: submissions === 1 ? 422 : 200, contentType: 'application/json', body: submissions === 1 ? '{"errors":[{"message":"Rejected"}]}' : '{"ok":true}' });
    });
    await form.locator('[name="name"]').fill('Contact QA');
    await form.locator('[name="email"]').fill('qa@example.com');
    await form.locator('[name="message"]').fill('Please send product information.');
    await form.locator('button').click();
    await expect(form.locator('.form-status')).toHaveAttribute('data-state', 'error');
    await expect(form.locator('[name="message"]')).toHaveValue('Please send product information.');
    await expect(form.locator('button')).toBeEnabled();
    await form.locator('button').click();
    await expect(form.locator('.form-status')).toHaveAttribute('data-state', 'success');
    await expect(form.locator('[name="message"]')).toHaveValue('');
    expect(submissions).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
