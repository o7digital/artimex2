import { test, expect } from '@playwright/test';
for (const locale of ['es', 'en']) for (const width of [1440, 390]) {
  test(`Privacy watermark and header at ${width}px in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}/${locale === 'es' ? 'aviso-de-privacidad' : 'privacy-notice'}/`);
    const header = page.locator('.privacy-header');
    await expect(header).not.toHaveClass(/is-scrolled/);
    const watermark = page.locator('.privacy-watermark');
    await expect(watermark).toHaveAttribute('aria-hidden', 'true');
    expect(await watermark.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
    await watermark.locator('img').evaluate(img => img.decode());
    await expect(page.locator('.privacy-logo')).toHaveAttribute('alt', 'Artimex Artisan Mexican Bakery');
    const box = await page.locator('.privacy-logo').boundingBox();
    expect(box.width).toBe(width > 650 ? 140 : 105);
    await page.locator('.privacy-sidebar a[href="#information"]').click();
    await expect(header).toHaveClass(/is-scrolled/);
    await expect(header).toHaveCSS('background-color', 'rgba(41, 35, 29, 0.97)');
    await expect(header).toHaveCSS('color', 'rgb(244, 240, 232)');
    const title = await page.locator('#information-title').boundingBox();
    const headerBox = await header.boundingBox();
    expect(title.y).toBeGreaterThanOrEqual(headerBox.height);
    await expect(page.locator('.footer-logo')).toHaveAttribute('alt', 'Artimex Artisan Mexican Bakery');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => scrollTo(0, 0));
    await expect(header).not.toHaveClass(/is-scrolled/);
  });
}
