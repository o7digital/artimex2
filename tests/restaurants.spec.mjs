import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`Restaurant directory at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/es/#business');
    const trigger = page.getByRole('button', { name: '01 Restaurantes' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Nuestros restaurantes.' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.restaurant-card')).toHaveCount(10);
    await expect(dialog.locator('.restaurant-card h3')).toHaveText(['Canoga Park', 'Panorama City', 'Downtown L.A.', 'Huntington Park', 'Lynwood', 'East Los Angeles', 'Santa Ana', 'Fontana', 'Van Nuys', 'Bellflower']);
    await expect(dialog.locator('address').first()).toContainText('20901 Sherman Way');
    await expect(dialog.locator('address').nth(2)).toContainText('701 E Jefferson Blvd');
    await expect(dialog.locator('address').last()).toContainText('9009 Alondra Blvd');
    expect(await dialog.locator('h3').first().evaluate(el => getComputedStyle(el).fontFamily)).toContain('Cormorant');
    for (const link of await dialog.getByRole('link').all()) {
      await expect(link).toHaveAttribute('href', /^https:\/\/(goo\.gl\/maps\/|maps\.app\.goo\.gl\/)/);
      await expect(link).toHaveAttribute('target', '_blank');
    }
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await dialog.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.getByRole('button', { name: 'Cerrar restaurantes' }).click();
    await expect(dialog).toBeHidden();
    await page.goto('/en/#business');
    await page.getByRole('button', { name: '01 Restaurants' }).click();
    await expect(page.getByRole('dialog', { name: 'Our restaurants.' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Directions to El Gallo Giro Bellflower' })).toBeVisible();
    await page.getByRole('button', { name: 'Close restaurants' }).click();
    await expect(page.locator('body')).not.toHaveClass(/dialog-open/);
  });
}
