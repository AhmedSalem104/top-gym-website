import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { business, durationIds } from '../../src/config/business';
import { money } from '../../src/i18n';

for (const locale of ['ar', 'en'] as const) {
  for (const width of [320, 390, 768, 1440, 1920]) {
    test(`${locale} responsive layout at ${width}px`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/`);
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await expect(page.locator('h1')).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      for (const img of await page.locator('main img').all()) {
        await img.scrollIntoViewIfNeeded();
        await expect(img).toHaveJSProperty('complete', true);
        await expect(img).not.toHaveJSProperty('naturalWidth', 0);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      for (const id of [
        'about',
        'facilities',
        'gallery',
        'memberships',
        'schedule',
        'location',
        'contact',
      ]) {
        await expect(page.locator(`#${id}`)).toHaveCount(1);
      }
      expect(
        await page
          .locator('a[href^="#"]')
          .evaluateAll((anchors) =>
            anchors
              .filter((a) => !document.getElementById(a.getAttribute('href')!.slice(1)))
              .map((a) => a.getAttribute('href')),
          ),
      ).toEqual([]);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({
        path: testInfo.outputPath(`${locale}-${width}.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });
  }

  test(`${locale} price selector and complete comparison table`, async ({ page }) => {
    await page.goto(`/${locale}/`);
    for (const duration of durationIds) {
      await page.locator('#membership-duration').selectOption(duration);
      for (const plan of business.memberships)
        await expect(page.locator(`[data-price="${plan.id}"]`)).toHaveText(
          money(plan.prices[duration], locale),
        );
    }
    await page.locator('summary').click();
    await expect(page.locator('tbody tr')).toHaveCount(6);
    await expect(page.locator('a[href="tel:+201015819700"]').first()).toBeAttached();
    await expect(page.locator('a[href="tel:+201005376843"]').first()).toBeAttached();
    for (const url of Object.values(business.links))
      expect(
        await page
          .locator('a')
          .evaluateAll(
            (anchors, href) => anchors.some((a) => a.getAttribute('href') === href),
            url,
          ),
      ).toBe(true);
    await expect(page.locator('form')).toHaveCount(0);
  });

  test(`${locale} accessible gallery dialog, focus return and keyboard navigation`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/`);
    const opener = page.locator('[data-lightbox="gym"]').first();
    await opener.click();
    await expect(page.locator('#lightbox')).toBeVisible();
    await expect(page.locator('[data-lightbox-close]')).toBeFocused();
    const original = await page.locator('#lightbox-image').getAttribute('src');
    await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
    await expect(page.locator('#lightbox-image')).not.toHaveAttribute('src', original!);
    await page.locator('[data-lightbox-next]').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-lightbox-close]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).not.toBeVisible();
    await expect(opener).toBeFocused();
  });

  test(`${locale} mobile menu and WCAG scan`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/`);
    const toggle = page.locator('.menu-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#mobile-nav a[href="#memberships"]').click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(new RegExp('#memberships$'));
    await toggle.click();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  });
}
test('language switching preserves section and persists explicit preference', async ({ page }) => {
  await page.goto('/ar/#memberships');
  await page.locator('[data-language-switch]').click();
  await expect(page).toHaveURL('/en/#memberships');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/');
  await expect(page).toHaveURL('/en/');
  await page.goto('/ar/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});
test('no-JavaScript content and safe prelaunch metadata', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/en/');
  await expect(page.locator('h1')).toBeVisible();
  await page.locator('summary').click();
  await expect(page.locator('tbody tr')).toHaveCount(6);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('#credentials')).toHaveCount(0);
  await context.close();
});
test('reduced motion and current-day indicator', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/');
  expect(await page.locator('html').evaluate((html) => getComputedStyle(html).scrollBehavior)).toBe(
    'auto',
  );
  await expect(page.locator('.is-today')).toHaveCount(1);
  await expect(page.locator('[data-open-status]')).toBeVisible();
});
