import { test, expect } from '@playwright/test';
import { business } from '../../src/config/business';
import { motion } from '../../src/config/motion';

for (const locale of ['ar', 'en']) {
  test(`${locale} spotlight aligns, follows every anchor, resists boundary jitter and respects motion preference`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/#about`);
    await page.evaluate(() => document.fonts.ready);
    const nav = page.locator('.desktop-nav');
    const spotlight = nav.locator('.nav-spotlight');
    const active = nav.locator('[aria-current="location"]');
    await expect(active).toHaveAttribute('href', '#about');
    await expect(spotlight).toHaveCount(1);
    const height = (await page.locator('.site-header').boundingBox())!.height;
    const ids = await nav
      .locator('[data-section-link]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')!.slice(1)));
    await page.evaluate(() => {
      Object.assign(window, { navActiveHistory: [] as string[] });
      new MutationObserver(() => {
        const hash =
          document.querySelector('.desktop-nav [aria-current="location"]')?.getAttribute('href') ??
          '';
        (window as unknown as { navActiveHistory: string[] }).navActiveHistory.push(hash);
      }).observe(document.querySelector('.desktop-nav')!, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-current'],
      });
    });
    for (const id of ids) {
      await page.evaluate(() => {
        (window as unknown as { navActiveHistory: string[] }).navActiveHistory = [];
      });
      await nav.locator(`[href="#${id}"]`).click();
      await expect(active).toHaveAttribute('href', `#${id}`);
      await expect
        .poll(() =>
          page.locator(`#${id}`).evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
        )
        .toBeLessThan(150);
      await expect
        .poll(async () => {
          const light = (await spotlight.boundingBox())!;
          const link = (await active.boundingBox())!;
          return Math.abs(light.x + light.width / 2 - link.x - link.width / 2);
        })
        .toBeLessThan(2);
      expect(
        await page.evaluate(
          (hash) =>
            (window as unknown as { navActiveHistory: string[] }).navActiveHistory.every(
              (value) => value === hash,
            ),
          `#${id}`,
        ),
      ).toBe(true);
      expect((await page.locator('.site-header').boundingBox())!.height).toBe(height);
    }
    for (const id of [...ids].reverse()) {
      await page.locator(`#${id}`).evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
      await expect(active).toHaveAttribute('href', `#${id}`);
    }
    await page.evaluate(async () => {
      const next = document.querySelector('#facilities')!;
      const boundary =
        scrollY + next.getBoundingClientRect().top - (innerHeight - Math.round(innerHeight * 0.65));
      (window as unknown as { navActiveHistory: string[] }).navActiveHistory = [];
      for (const delta of [-2, 2, -2, 2, -2, 2]) {
        window.scrollTo({ top: boundary + delta, behavior: 'instant' });
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    });
    await expect(active).toHaveAttribute('href', '#facilities');
    expect(
      await page.evaluate(
        () => (window as unknown as { navActiveHistory: string[] }).navActiveHistory.length,
      ),
    ).toBeLessThanOrEqual(1);
    // Focus stays on the same link even if native focus scrolling updates ScrollSpy.
    // A live aria-current locator can resolve to a different element during Tab navigation.
    const focusedLink = nav.locator(`[href="${await active.getAttribute('href')}"]`);
    await focusedLink.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(focusedLink).toBeFocused();
    expect(await focusedLink.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
    expect(await spotlight.evaluate((el) => getComputedStyle(el).transitionDuration)).toContain(
      `${motion.duration.navigation / 1000}s`,
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await spotlight.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(nav).toBeHidden();
    await expect(spotlight).toHaveAttribute('data-visible', 'false');
    await page.setViewportSize({ width: 1920, height: 900 });
    await expect(spotlight).toHaveAttribute('data-visible', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

  test(`${locale} whole map opens the owner's exact location with pointer and keyboard`, async ({
    page,
    context,
  }) => {
    await page.goto(`/${locale}/#location`);
    const map = page.locator('.location-map iframe');
    const link = page.locator('[data-map-link]');
    await expect(map).toHaveAttribute(
      'src',
      `${business.location.embedBase}!3m1!1s${locale}!5m1!1s${locale}`,
    );
    await expect(map).toHaveAttribute('loading', 'lazy');
    await expect(map).toHaveAttribute(
      'title',
      locale === 'ar' ? 'خريطة موقع توب جيم' : 'Map showing the TOP GYM location',
    );
    await expect(link).toHaveAttribute('href', business.links.maps);
    // External destination response is isolated; live Google pin verification is documented separately.
    await context.route(business.links.maps, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Maps destination test</title>',
      }),
    );
    const popupEvent = page.waitForEvent('popup');
    await link.click({ position: { x: 100, y: 200 } });
    const popup = await popupEvent;
    await expect(popup).toHaveURL(business.links.maps);
    await popup.close();
    await link.focus();
    const keyboardEvent = page.waitForEvent('popup');
    await page.keyboard.press('Enter');
    const keyboardPopup = await keyboardEvent;
    await expect(keyboardPopup).toHaveURL(business.links.maps);
    await keyboardPopup.close();
  });
}
