import { test, expect } from '@playwright/test';

const positionIn = (page, id) => page.locator(`#${id}`).evaluate(element => {
  const offset = document.querySelector('header').getBoundingClientRect().bottom + 24;
  return (offset - element.getBoundingClientRect().top) / element.offsetHeight;
});

const readSection = async (page, id, progress = .25) => {
  await page.evaluate(() => document.fonts.ready);
  await page.locator(`#${id}`).evaluate((element, progress) => {
  const offset = document.querySelector('header').getBoundingClientRect().bottom + 24;
  scrollTo({ top: scrollY + element.getBoundingClientRect().top + element.offsetHeight * progress - offset, behavior: 'instant' });
  }, progress);
};

// Click the sticky header where a user clicks, without scrollIntoView changing the reading position.
const clickPrivacyLanguage = async page => {
  const bounds = await page.locator('.privacy-language').boundingBox();
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
};

for (const width of [1440, 390]) {
  test(`Language follows manual scrolling and preserves position at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/es/');
    await readSection(page, 'collection', .45);
    await expect(page.locator('.site-header')).toHaveClass(/is-scrolled/);
    const progress = await positionIn(page, 'collection');
    await page.locator('.language-switch a[lang="en"]').click();
    await expect(page).toHaveURL(/\/en\/#collection$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect.poll(() => positionIn(page, 'collection')).toBeGreaterThan(progress - .03);
    await expect.poll(() => positionIn(page, 'collection')).toBeLessThan(progress + .03);
    await expect(page.locator('#collection .section-heading h2')).toContainText('A collection');

    // Scrolling away from the URL anchor must follow the new section.
    for (const [locale, id] of [['es', 'business'], ['en', 'careers'], ['es', 'contact'], ['en', 'story'], ['es', 'essence']]) {
      await readSection(page, id);
      await page.locator(`.language-switch a[lang="${locale}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/#${id}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect.poll(() => positionIn(page, id)).toBeGreaterThanOrEqual(0);
      await expect.poll(() => positionIn(page, id)).toBeLessThan(1);
    }

    await page.locator('.footer-languages').scrollIntoViewIfNeeded();
    await page.locator('.footer-languages a[lang="en"]').click();
    await expect(page).toHaveURL(/\/en\/#site-footer$/);
    await expect(page.locator('.footer-languages')).toBeInViewport();
    await page.locator('.footer-languages a[lang="es"]').click();
    await expect(page).toHaveURL(/\/es\/#site-footer$/);
    await expect(page.locator('.footer-languages')).toBeInViewport();

    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.locator('.language-switch a[lang="en"]').click();
    await expect(page).toHaveURL(/\/en\/$/);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(10);
  });

  test(`Privacy language retains the legal section at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/es/aviso-de-privacidad/#information');
    await readSection(page, 'cookies', .25);
    await clickPrivacyLanguage(page);
    await expect(page).toHaveURL(/\/en\/privacy-notice\/#cookies$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#cookies')).toBeInViewport();
    await clickPrivacyLanguage(page);
    await expect(page).toHaveURL(/\/es\/aviso-de-privacidad\/#cookies$/);
    await expect(page.locator('#cookies')).toBeInViewport();
  });
}
