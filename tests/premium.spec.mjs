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
    await expect(page.locator('.footer-contact address')).toContainText('12764 Florence Avenue');
    await expect(page.locator('.footer-phone')).toContainText('562-777-9607');
    await expect(page.locator('.footer-email')).toHaveAttribute('href', 'mailto:sales@artimex.com');
    await expect(page.locator('.footer-explore a')).toHaveCount(6);
    await expect(page.locator('.footer-explore a[href="/es/#collection"]')).toHaveText('Nuestros panes');
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
    await expect(page.locator('.product-card:visible')).toHaveCount(0);
    await page.getByRole('button', { name: 'Dulces', exact: true }).click();
    await expect(page.locator('.product-card:visible')).toHaveCount(12);
    await page.getByRole('button', { name: 'Todos', exact: true }).click();
    await expect(page.locator('.product-card:visible')).toHaveCount(12);
    const photoPaths = await page.locator('.product-image-button img').evaluateAll(images => images.map(image => decodeURI(new URL(image.src).pathname)));
    expect(new Set(photoPaths).size).toBe(12);
    expect(photoPaths.every(path => path.startsWith('/images/breads/'))).toBe(true);
    expect(photoPaths[0]).toBe('/images/breads/concha-chocolate-750.webp');
    await expect(page.locator('.product-card h3').first()).toHaveText('Concha Chocolate');
    await expect(page.locator('.product-card h3').nth(3)).toHaveText('Mantecadas');
    await expect(page.locator('.product-card h3').nth(4)).toHaveText('Concha de fresa');
    await expect(page.locator('.product-card h3').nth(5)).toHaveText('Puerquitos');
    expect(photoPaths[3]).toBe('/images/breads/mantecadas-750.webp');
    expect(photoPaths[5]).toBe('/images/breads/puerquitos-750.webp');
    await expect(page.locator('.product-card h3').nth(9)).toHaveText('Niño envuelto');
    await expect(page.locator('.product-card h3').nth(10)).toHaveText('Elote fino');
    await expect(page.locator('.product-card h3').nth(11)).toHaveText('Pan relleno');
    expect(photoPaths.slice(9)).toEqual(['/images/breads/nino-envuelto-750.webp', '/images/breads/elote-fino-750.webp', '/images/breads/pan-relleno-750.webp']);
    for (const index of [9, 10, 11]) {
      await page.locator('.product-image-button').nth(index).click();
      await expect(page.locator('.product-dialog h2')).toHaveText(['Niño envuelto', 'Elote fino', 'Pan relleno'][index - 9]);
      await expect(page.locator('.product-dialog-image img')).toHaveAttribute('src', photoPaths[index]);
      await page.locator('.product-dialog').press('Escape');
    }
    await page.locator('.product-image-button').first().click();
    await expect(page.locator('.product-dialog')).toBeVisible();
    await expect(page.locator('.product-dialog h2')).toHaveText('Concha Chocolate');
    await page.getByRole('button', { name: 'Consultar este producto' }).click();
    await expect(page.locator('#contact-dialog')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toHaveValue(/Concha Chocolate/);
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
    for (const button of await page.locator('.family-list button').all()) {
      const name = (await button.innerText()).replace(/\d+/g, '').trim();
      await button.click();
      const details = page.locator('#bread-details-dialog');
      await expect(details).toBeVisible();
      await expect(details.locator('article:visible h2')).toHaveText(name);
      await expect(details.locator('article:visible .bread-ingredients li').first()).toBeVisible();
      await expect(details.locator('form')).toHaveCount(0);
      await expect(page.locator('#contact-dialog')).toBeHidden();
      await page.getByRole('button', { name: 'Volver a la colección', exact: true }).click();
      await expect(details).toBeHidden();
      await expect(button).toBeFocused();
    }
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
