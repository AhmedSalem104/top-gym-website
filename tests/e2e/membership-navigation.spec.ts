import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { business } from '../../src/config/business';
import { money } from '../../src/i18n';

for (const locale of ['ar', 'en'] as const) {
  test(`${locale} duration tabs keyboard, AR label and original PDF download`, async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/`);
    await expect(page.locator('.language-switch [lang="ar"]').first()).toHaveText('AR');
    await expect(page.locator('.language-switch [lang="ar"]').first()).toHaveAttribute(
      'aria-label',
      'AR — العربية',
    );
    await expect(page.getByRole('tab')).toHaveCount(6);
    await expect(page.locator('[data-duration="halfMonth"]')).toHaveText(
      locale === 'ar' ? 'نص شهر' : 'Half month',
    );
    await expect(page.locator('[data-duration="twoMonths"]')).toHaveText(
      locale === 'ar' ? 'شهرين' : '2 months',
    );
    await page.locator('[data-duration="month"]').focus();
    await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
    await expect(page.locator('[data-duration="twoMonths"]')).toBeFocused();
    await expect(page.getByRole('tab', { selected: true })).toHaveAttribute(
      'data-duration',
      'twoMonths',
    );
    await page.keyboard.press('End');
    await expect(page.locator('[data-duration="year"]')).toBeFocused();
    await expect(page.locator('[data-price="gym"]')).toHaveText(money(4200, locale));
    await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
    await expect(page.locator('[data-duration="halfMonth"]')).toBeFocused();
    await page.keyboard.press(locale === 'ar' ? 'ArrowRight' : 'ArrowLeft');
    await expect(page.locator('[data-duration="year"]')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('[data-duration="halfMonth"]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tabpanel')).toBeFocused();
    await expect(page.locator('.duration-tabs [tabindex="0"]')).toHaveCount(1);

    const response = await request.get(business.pricingSource.url);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('application/pdf');
    const pdf = await response.body();
    expect(pdf.length).toBe(business.pricingSource.bytes);
    expect(createHash('sha256').update(pdf).digest('hex')).toBe(business.pricingSource.sha256);
    const downloadEvent = page.waitForEvent('download');
    await page.locator('[data-pricing-download]').click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe(business.pricingSource.filename);
    const downloaded = await readFile((await download.path())!);
    expect(createHash('sha256').update(downloaded).digest('hex')).toBe(
      business.pricingSource.sha256,
    );
    await expect(page.locator('[data-pricing-view]')).toHaveAttribute('target', '_blank');
    await expect(page.locator('.pricing-document-preview img')).toHaveJSProperty('complete', true);
    await expect(page.locator('.pricing-document-preview img')).not.toHaveJSProperty(
      'naturalWidth',
      0,
    );
  });

  for (const width of [390, 768, 1440]) {
    test(`${locale} active navbar tracks clicks, scrolling and hash at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/#gallery`);
      const active = page.locator('[data-section-link][aria-current="location"]');
      await expect(active).toHaveCount(2);
      await expect(active.first()).toHaveAttribute('href', '#gallery');
      if (width < 1360) await page.locator('.menu-toggle').click();
      const nav = page.locator(width < 1360 ? '#mobile-nav' : '.desktop-nav');
      await nav.locator('[href="#memberships"][data-section-link]').click();
      await expect(page).toHaveURL(new RegExp('#memberships$'));
      await expect
        .poll(() =>
          page.locator('#memberships').evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
        )
        .toBeLessThan(150);
      await expect(active.first()).toHaveAttribute('href', '#memberships');
      for (const id of ['schedule', 'contact', 'facilities', 'about']) {
        await page
          .locator(`#${id}`)
          .evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
        await expect(active).toHaveCount(2);
        await expect(active.first()).toHaveAttribute('href', `#${id}`);
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      if (width < 1360) {
        // Click the visible sticky control without Playwright auto-scrolling its ancestor.
        const before = await page.evaluate(() => scrollY);
        const bounds = (await page.locator('.menu-toggle').boundingBox())!;
        await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        expect(await page.evaluate(() => scrollY)).toBe(before);
      }
      const visibleActive = nav.locator('[aria-current="location"]');
      await expect(visibleActive).toBeVisible();
      // About's anchor leaves the hero's last 100px visible; the header stays dark here.
      expect(await visibleActive.evaluate((el) => getComputedStyle(el).color)).toBe(
        'rgb(229, 149, 0)',
      );
      if (width < 1360)
        expect(
          await visibleActive.evaluate((el) => getComputedStyle(el, '::after').transform),
        ).toBe('matrix(1, 0, 0, 1, 0, 0)');
      else {
        await expect(page.locator('.nav-spotlight')).toHaveAttribute('data-visible', 'true');
        expect(
          await page
            .locator('.nav-spotlight')
            .evaluate((el) => getComputedStyle(el).transitionDuration),
        ).toBe('0s');
      }
      if (width < 1360) await page.keyboard.press('Escape');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await expect(active).toHaveCount(2);
      await expect(active.first()).toHaveAttribute('href', '#top');
      await page.evaluate(() => {
        location.hash = 'location';
      });
      await expect(active.first()).toHaveAttribute('href', '#location');
      await page.reload();
      await expect(active.first()).toHaveAttribute('href', '#location');
    });
  }
}

test('navbar retains click feedback if IntersectionObserver is unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    window.IntersectionObserver = class {
      constructor() {
        throw new Error('Unavailable');
      }
    } as unknown as typeof IntersectionObserver;
  });
  await page.goto('/en/');
  await page.locator('.desktop-nav [href="#memberships"]').click();
  await expect(page.locator('.desktop-nav [aria-current="location"]')).toHaveAttribute(
    'href',
    '#memberships',
  );
});
