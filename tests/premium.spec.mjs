import { test, expect } from '@playwright/test';
for (const width of [1440, 768, 390, 320]) {
  test(`Premium homepage and bilingual interactions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('.hero')).toHaveClass(/is-paused/);
    await expect(page.locator('.hero h1')).toHaveText('El arte decompartir.');
    const heroBounds = await page.locator('.hero').boundingBox();
    expect(heroBounds.height).toBe(900);
    await page.getByRole('button', { name: 'Escena siguiente', exact: true }).click();
    await expect(page.locator('.hero h1')).toHaveText('Un dulcereencuentro.');
    await page.locator('.hero').press('ArrowRight');
    await expect(page.locator('.hero h1')).toHaveText('Pan conalma.');
    await page.getByRole('button', { name: 'Escena anterior', exact: true }).click();
    await page.locator('.scene-tab').first().click();
    await expect(page.locator('.hero h1')).toHaveText('El arte decompartir.');
    await page.getByRole('button', { name: 'Pausar slider', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Reanudar slider' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Reanudar slider' }).click();
    await expect(page.locator('.pause-button')).toHaveAttribute('aria-pressed', 'false');
    expect(await page.locator('.hero-scene.is-active img').evaluate(image => image.currentSrc.endsWith(innerWidth <= 650 ? 'hero-bread-mobile.webp' : 'hero-bread.webp'))).toBe(true);
    if (width <= 1000) {
      await page.getByRole('button', { name: 'Abrir menú' }).click();
      await expect(page.locator('main')).toHaveAttribute('inert', '');
      await page.locator('#mobile-menu a[href="#collection"]').click();
      await expect(page.locator('#mobile-menu')).toBeHidden();
      await expect(page.locator('main')).not.toHaveAttribute('inert', '');
    } else await page.locator('.desktop-nav a[href="#collection"]').click();
    await expect(page).toHaveURL(/#collection$/);
    await page.locator('.product-grid').scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island').filter({ has: page.locator('.product-grid') })).not.toHaveAttribute('ssr', '');
    await page.getByRole('button', { name: 'Salados', exact: true }).click();
    await expect(page.locator('.product-card:visible')).toHaveCount(1);
    await expect(page.locator('.product-card:visible h3')).toHaveText('Bolillos');
    await page.getByRole('button', { name: 'Dulces', exact: true }).click();
    await expect(page.locator('.product-card:visible')).toHaveCount(2);
    await page.getByRole('button', { name: 'Todos', exact: true }).click();
    await page.locator('.product-image-button').first().click();
    await expect(page.locator('.product-dialog')).toBeVisible();
    await expect(page.locator('.product-dialog h2')).toHaveText('Conchas');
    await page.getByRole('button', { name: 'Consultar este producto' }).click();
    await expect(page.locator('#contact-dialog')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toHaveValue(/Conchas/);
    await page.locator('input[name="name"]').fill('Preview QA');
    await page.locator('input[name="email"]').fill('preview@example.com');
    await page.getByRole('button', { name: 'Preparar mi consulta' }).click();
    await expect(page.locator('#contact-ready')).toBeVisible();
    await expect(page.locator('#inquiry-draft')).toHaveValue(/Preview QA/);
    await expect(page.locator('#contact-mailto')).toHaveAttribute('href', /^mailto:sales@artimex.com\?subject=/);
    await page.getByRole('button', { name: 'Editar consulta' }).click();
    await expect(page.locator('#contact-form')).toBeVisible();
    await page.locator('#contact-dialog').press('Escape');
    await expect(page.locator('#contact-dialog')).toBeHidden();
    await page.getByRole('button', { name: 'Más de nuestra panadería' }).click();
    await expect(page.locator('.family-list button')).toHaveCount(8);
    await page.locator('.family-list button').first().click();
    await expect(page.locator('textarea[name="message"]')).toHaveValue(/Pan fino/);
    await page.getByRole('button', { name: 'Cerrar contacto', exact: true }).click();
    for (const id of ['story', 'collection', 'business', 'contact']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    }
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('main img')].filter(image => !image.closest('dialog')).every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    const overflow = await page.evaluate(() => [...document.querySelectorAll('main *, header *, footer *')].filter(element => {
      if (!element.getClientRects().length) return false;
      const r = element.getBoundingClientRect();
      if (element.closest('.hero-scenes,.business-texture') || element.classList.contains('story-signature')) return false;
      return r.width && (r.left < -1 || r.right > innerWidth + 1);
    }).map(element => element.className));
    expect(overflow).toEqual([]);
    await page.evaluate(() => { document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible')); scrollTo(0, 0); });
    await page.screenshot({ path: `test-results/premium-es-${width}.png`, fullPage: true });
    await page.locator('.language-switch a[lang="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.hero h1')).toHaveText('A taste ofhome.');
    await page.locator('.hero').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero')).toHaveClass(/is-paused/);
    await page.getByRole('button', { name: 'Next scene' }).click();
    await expect(page.locator('.hero h1')).toHaveText('A littlesweetness.');
    await page.goto('/es/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    expect(errors).toEqual([]);
  });
}

test('Automatic slider, swipe and preserved box link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install();
  await page.goto('/en/');
  await expect(page.locator('astro-island').filter({ has: page.locator('.hero') })).not.toHaveAttribute('ssr', '');
  await page.clock.runFor(7600);
  await expect(page.locator('.scene-tab').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Pause slideshow' }).click();
  await page.clock.runFor(16000);
  await expect(page.locator('.scene-tab').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.hero').evaluate(hero => {
    for (const [type, x] of [['touchstart', 300], ['touchend', 180]]) {
      hero.dispatchEvent(new TouchEvent(type, { bubbles: true, changedTouches: [new Touch({ identifier: 1, target: hero, clientX: x, clientY: 400 })] }));
    }
  });
  await expect(page.locator('.scene-tab').nth(2)).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/#masa-box');
  await expect(page).toHaveURL(/\/box\/#masa-box$/);
  await expect(page.locator('#masa-count')).toHaveText('0 / 6');
});
