import { test, expect } from '@playwright/test';
for (const locale of ['es', 'en']) {
  test(`Careers application in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: locale === 'es' ? 1440 : 390, height: 900 });
    await page.goto(`/${locale}/#careers`);
    const trigger = page.locator('[data-careers]');
    await trigger.click();
    const dialog = page.locator('#careers-dialog');
    const form = page.locator('#careers-form');
    await expect(dialog).toBeVisible();
    await expect(form).toHaveAttribute('action', 'https://formspree.io/f/meaeqdaj');
    await form.locator('[name="name"]').fill('Application QA');
    await form.locator('[name="email"]').fill('candidate@example.com');
    await form.locator('[name="message"]').fill('Five years of baking experience.');
    await form.locator('[name="resume_url"]').fill('https://example.com/resume.pdf');
    let attempts = 0;
    await page.route('https://formspree.io/f/meaeqdaj', async route => {
      const body = route.request().postData();
      expect(body).toContain(locale === 'es' ? 'Empleo en Artimex' : 'Careers at Artimex');
      expect(body).toContain('https://example.com/resume.pdf');
      expect(body).toContain('Five years of baking experience.');
      attempts++;
      await route.fulfill({ status: attempts === 1 ? 422 : 200, contentType: 'application/json', body: attempts === 1 ? '{"errors":[]}' : '{"ok":true}' });
    });
    await form.locator('button[type="submit"]').click();
    await expect(form.getByRole('status')).toHaveAttribute('data-state', 'error');
    await expect(form.locator('[name="message"]')).toHaveValue('Five years of baking experience.');
    await form.locator('button[type="submit"]').click();
    await expect(form.getByRole('status')).toHaveAttribute('data-state', 'success');
    await expect(form.locator('[name="message"]')).toHaveValue('');
    await dialog.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(attempts).toBe(2);
  });
}
