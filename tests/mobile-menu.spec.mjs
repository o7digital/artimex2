import { test, expect } from '@playwright/test';

for (const locale of ['en', 'es']) for (const [width, height] of [[390, 844], [320, 568], [844, 390]]) {
  test(`Full mobile menu in ${locale} at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto(`/${locale}/`);
    const toggle = page.locator('#menu-toggle');
    const menu = page.locator('#mobile-menu');
    const verifyOpen = async () => {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      const bounds = await menu.boundingBox();
      expect(bounds.y).toBe(0);
      expect(bounds.height).toBe(height);
      expect(bounds.width).toBe(width);
      await expect(page.locator('main')).toHaveAttribute('inert', '');
      await expect(page.locator('.language-switch')).toBeInViewport();
      await expect(toggle).toBeInViewport();
    };

    // Every link must work both before and after the header turns black on scroll.
    for (const section of ['collection', 'story', 'business', 'careers', 'contact']) {
      await verifyOpen();
      await menu.locator(`a[href="#${section}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${section}$`));
      await expect(menu).toBeHidden();
      await expect(page.locator('main')).not.toHaveAttribute('inert', '');
      await expect(page.locator('footer')).not.toHaveAttribute('inert', '');
    }

    await verifyOpen();
    await toggle.click();
    await expect(menu).toBeHidden();
    await verifyOpen();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await verifyOpen();
    await page.locator('.header-brand').click();
    await expect(menu).toBeHidden();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);

    await verifyOpen();
    const other = locale === 'en' ? 'es' : 'en';
    await page.locator(`.language-switch a[lang="${other}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('lang', other);
    await expect(menu).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/menu-open/);
  });
}

test('Opening the desktop layout dismisses the mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  await page.locator('#menu-toggle').click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('#mobile-menu')).toBeHidden();
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  await expect(page.locator('.desktop-nav')).toBeVisible();
});
