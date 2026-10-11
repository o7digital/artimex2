import { test, expect } from '@playwright/test';
for (const locale of ['en', 'es']) {
  test(`Olivia chat, retry, conversation and contact handoff in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let calls = 0;
    await page.route('**/api/olivia', async route => {
      const body = route.request().postDataJSON();
      expect(body.language).toBe(locale);
      expect(body.message).toBe('I need bread for my cafe');
      expect(body).not.toHaveProperty('tenant');
      calls++;
      if (calls === 3) expect(body.conversation).toBe('signed-conversation');
      await route.fulfill({ status: calls === 1 ? 503 : 200, contentType: 'application/json', body: JSON.stringify(calls === 1 ? {error:'Unavailable'} : {answer:'Please contact sales@artimex.com for packaging options.',conversation:'signed-conversation',version:'3.5'}) });
    });
    await page.goto(`/${locale}/`);
    const root = page.locator('.olivia');
    await root.locator('.olivia-toggle').click();
    await expect(root.locator('#olivia-input')).toBeFocused();
    await expect(root.locator('.olivia-privacy a')).toHaveAttribute('href', locale === 'en' ? '/en/privacy-notice/' : '/es/aviso-de-privacidad/');
    await root.locator('#olivia-input').fill('I need bread for my cafe');
    await root.locator('.olivia-form button').click();
    await expect(root.locator('.olivia-feedback')).toHaveAttribute('data-state','error');
    await root.locator('.olivia-feedback button').click();
    await expect(root.locator('.olivia-message.assistant')).toHaveCount(1);
    await expect(root.locator('.olivia-message.user')).toHaveCount(1);
    await root.locator('#olivia-input').fill('I need bread for my cafe');
    await root.locator('.olivia-form button').click();
    await expect(root.locator('.olivia-message.assistant')).toHaveCount(2);
    await root.locator('.olivia-contact').click();
    await expect(page.locator('#contact-dialog')).toBeVisible();
    await expect(page.locator('#contact-form [name="message"]')).toHaveValue('I need bread for my cafe');
    expect(calls).toBe(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
for (const [width,height] of [[1440,1000],[320,568],[844,390]]) {
  test(`Olivia panel stays inside viewport at ${width}x${height}`, async ({page})=>{
    await page.setViewportSize({width,height});
    await page.goto('/en/');
    await page.locator('.olivia-toggle').click();
    const panel=page.locator('.olivia-panel');
    const box=await panel.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.y+box.height).toBeLessThanOrEqual(height);
    await expect(page.locator('.olivia-form button')).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(page.locator('.olivia-toggle')).toBeFocused();
  });
}
