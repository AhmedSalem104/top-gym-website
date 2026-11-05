import { expect, test } from '@playwright/test';
import { business } from '../../src/config/business';
import { motion } from '../../src/config/motion';

const sections = [
  '#about',
  '#facilities',
  '#credentials',
  '#gallery',
  '#memberships',
  '#schedule',
  '#location',
  '#contact',
  '.final-cta',
  '.site-footer',
];

for (const locale of ['ar', 'en']) {
  for (const width of [390, 768, 1440]) {
    test(`${locale} motion coverage, viewport activation and no replay at ${width}`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/${locale}/`);
      const last = page.locator('.footer-bottom');
      await expect(last).toHaveAttribute('data-motion-state', 'pending');
      expect(await last.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
      await expect(page.locator('#hero-title')).toHaveAttribute('data-motion-state', 'complete');
      const beforeHeader = await page.locator('.site-header').boundingBox();
      const coverage: Record<string, number> = {};
      for (const section of sections) {
        const items = page.locator(`${section} [data-motion]`);
        coverage[section] = await items.count();
        expect(coverage[section]).toBeGreaterThan(0);
        for (const item of await items.all()) {
          await item.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
          await expect(item).toHaveAttribute('data-motion-state', 'complete');
          expect(await item.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
        }
      }
      await expect(page.locator('.site-header')).toHaveClass(/is-scrolled/);
      expect((await page.locator('.site-header').boundingBox())?.height).toBe(beforeHeader?.height);
      // Return upward quickly: previously revealed items must not replay.
      for (const section of [...sections].reverse()) {
        await page.locator(section).evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
        expect(await page.locator(`${section} [data-motion-state="running"]`).count()).toBe(0);
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await expect(page.locator('.site-header')).not.toHaveClass(/is-scrolled/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await testInfo.attach('motion-coverage', {
        body: JSON.stringify(coverage, null, 2),
        contentType: 'application/json',
      });
      await page.screenshot({
        path: testInfo.outputPath(`${locale}-${width}-motion.png`),
        animations: 'disabled',
      });
    });
  }
}

test('one motion observer, bounded stagger in RTL reading order, dynamic content and cleanup', async ({
  page,
}) => {
  await page.addInitScript(
    ({ rootMargin }) => {
      const NativeObserver = window.IntersectionObserver;
      Object.assign(window, { motionObservers: 0 });
      window.IntersectionObserver = class extends NativeObserver {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          super(callback, options);
          if (options?.rootMargin === rootMargin)
            Object.assign(window, {
              motionObservers:
                (window as unknown as { motionObservers: number }).motionObservers + 1,
            });
        }
      };
    },
    { rootMargin: motion.observer.rootMargin },
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ar/');
  const grid = page.locator('.facility-grid');
  await grid.evaluate((el) =>
    window.scrollTo({
      top: scrollY + el.getBoundingClientRect().top - innerHeight - 40,
      behavior: 'instant',
    }),
  );
  await page.waitForTimeout(100);
  await grid.evaluate((el) =>
    window.scrollTo({
      top: scrollY + el.getBoundingClientRect().top - innerHeight - 12,
      behavior: 'instant',
    }),
  );
  await expect(grid.locator('[data-motion-state="running"]').first()).toBeAttached();
  const delays = await grid.locator('[data-motion]').evaluateAll((items) =>
    items.map((el) => ({
      x: el.getBoundingClientRect().x,
      delay: el.getAnimations()[0]?.effect?.getTiming().delay ?? 0,
    })),
  );
  expect(delays[0].x).toBeGreaterThan(delays[1].x);
  expect(delays[1].delay).toBeGreaterThanOrEqual(delays[0].delay);
  expect(delays.every(({ delay }) => delay <= motion.delayCap)).toBe(true);
  await page.locator('.footer-bottom').evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
  await page.evaluate(() => {
    const item = document.createElement('p');
    item.dataset.motion = 'reveal';
    item.id = 'dynamic-motion';
    item.textContent = 'Dynamic content';
    document.querySelector('.footer-bottom')!.append(item);
    document.dispatchEvent(new Event('motion:refresh'));
    document.dispatchEvent(new Event('motion:refresh'));
  });
  await page.locator('#dynamic-motion').scrollIntoViewIfNeeded();
  await expect(page.locator('#dynamic-motion')).toHaveAttribute('data-motion-state', 'complete');
  expect(
    await page.evaluate(() => (window as unknown as { motionObservers: number }).motionObservers),
  ).toBe(1);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.getAnimations().filter((animation) => animation.playState === 'running').length,
      ),
    )
    .toBe(0);
  // Simulate bfcache lifecycle: teardown before restoring, with no repeated entrance.
  await page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect(page.locator('#dynamic-motion')).toHaveAttribute('data-motion-state', 'complete');
  expect(
    await page.evaluate(() => (window as unknown as { motionObservers: number }).motionObservers),
  ).toBe(2);
});

test('reduced motion changes cancel entrance and keep all content and controls available', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-motion-state="pending"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
  for (const section of sections) {
    await page.locator(section).scrollIntoViewIfNeeded();
    expect(
      await page
        .locator(`${section} [data-motion]`)
        .evaluateAll((items) => items.every((el) => getComputedStyle(el).opacity === '1')),
    ).toBe(true);
  }
  await page.locator('[data-lightbox="certificates"]').first().click();
  await expect(page.locator('#lightbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).not.toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#about').scrollIntoViewIfNeeded();
  expect(await page.locator('#about [data-motion-state="running"]').count()).toBe(0);
});

test('observer failure leaves content visible; keyboard focus skips pending motion', async ({
  browser,
  page,
}) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.IntersectionObserver = class {
      constructor() {
        throw new Error('Unavailable observer');
      }
    } as unknown as typeof IntersectionObserver;
  });
  const fallback = await context.newPage();
  await fallback.goto('/en/');
  await expect(fallback.locator('[data-motion-state="pending"]')).toHaveCount(0);
  expect(
    await fallback
      .locator('[data-motion]')
      .evaluateAll((items) => items.every((el) => getComputedStyle(el).opacity === '1')),
  ).toBe(true);
  await context.close();
  await page.goto('/en/');
  await page.locator('.credential-preview').first().focus();
  await expect(page.locator('.credential-card').first()).toHaveAttribute(
    'data-motion-state',
    'complete',
  );
  await expect(page.locator('.credential-preview').first()).toBeFocused();
});

test('mobile menu interrupts cleanly, restores focus, preserves links and never locks scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ar/');
  const toggle = page.locator('.menu-toggle');
  const menu = page.locator('#mobile-nav');
  await expect(page.locator('.header-group')).toHaveAttribute('href', business.links.whatsappGroup);
  expect(
    await toggle.evaluate((el: HTMLButtonElement) => {
      el.click();
      return document.querySelector('#mobile-nav')!.getAnimations().length > 0;
    }),
  ).toBe(true);
  await expect(menu.locator('[data-language-switch]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(menu).toBeHidden();
  await toggle.evaluate((el: HTMLButtonElement) => {
    el.click();
    el.click();
    el.click();
  });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();
  await page.waitForTimeout(300);
  await expect(menu).toBeVisible();
  await menu.locator('a[href="#memberships"]').click();
  await expect(menu).toBeHidden();
  await expect(page.locator('#memberships')).toBeFocused();
  expect(await page.locator('body').evaluate((el) => getComputedStyle(el).overflow)).not.toBe(
    'hidden',
  );
  await toggle.click();
  await menu.locator('[data-language-switch]').click();
  await expect(page).toHaveURL('/en/#memberships');
});

test('hero LCP content stays painted during entrance and prices respond without waiting', async ({
  page,
}) => {
  await page.goto('/en/');
  expect(await page.locator('#hero-title').evaluate((el) => getComputedStyle(el).opacity)).toBe(
    '1',
  );
  expect(await page.locator('.hero-image').evaluate((el) => getComputedStyle(el).opacity)).toBe(
    '1',
  );
  await page.locator('[data-duration="year"]').click();
  await expect(page.locator('[data-price="gym"]')).toContainText('4,200');
  await page.locator('[data-duration="month"]').click();
  await expect(page.locator('[data-price="gym"]')).toContainText('350');
});
