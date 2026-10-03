import { test, expect } from '@playwright/test';
for (const width of [1440, 768, 390, 320]) {
  test(`Layout and interactions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors = [];
    const failures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveTitle('Artimex Bakery — Panadería California');
    expect(await page.evaluate(() => document.fonts.check('32px Italiana') && document.fonts.check('14px "DM Sans"'))).toBe(true);
    await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    const overflow = await page.evaluate(() => [...document.querySelectorAll('#masa-preview *')].filter(element => {
      const bounds = element.getBoundingClientRect();
      return bounds.width && (bounds.right > innerWidth + 1 || bounds.left < -1);
    }).map(element => element.className));
    expect(overflow).toEqual([]);
    for (const id of ['masa-collection', 'masa-story', 'masa-box']) {
      await page.locator(`nav a[href="#${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
    }
    for (let i = 0; i < 6; i++) await page.locator('[data-flavor="Vanilla"]').click();
    await expect(page.locator('#masa-count')).toHaveText('6 / 6');
    await expect(page.locator('#masa-bag')).toHaveText('(6)');
    await expect(page.locator('.slot.filled')).toHaveCount(6);
    for (const button of await page.locator('[data-flavor]').all()) await expect(button).toBeDisabled();
    await page.locator('[data-flavor="Vanilla"]').evaluate(button => button.dispatchEvent(new Event('click')));
    await expect(page.locator('#masa-count')).toHaveText('6 / 6');
    await page.locator('#masa-reset').click();
    await expect(page.locator('#masa-count')).toHaveText('0 / 6');
    await expect(page.locator('#masa-bag')).toHaveText('(0)');
    await expect(page.locator('.slot.filled')).toHaveCount(0);
    await page.locator('#masa-surprise').click();
    await expect(page.locator('#masa-count')).toHaveText('6 / 6');
    await expect(page.locator('.slot[aria-label="Chocolate"]')).toHaveCount(2);
    await expect(page.locator('.slot[aria-label="Strawberry"]')).toHaveCount(1);
    await page.locator('#masa-order').click();
    await expect(page.locator('#masa-box')).toBeInViewport();
    await page.getByRole('button', { name: 'Discover morning pastries' }).click();
    await expect(page.locator('#masa-message')).toContainText('Illustrative collection');
    await page.locator('#masa-reset').click();
    await page.evaluate(() => { location.hash = ''; scrollTo(0, 0); });
    await page.screenshot({ path: `test-results/artimex-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  });
}
