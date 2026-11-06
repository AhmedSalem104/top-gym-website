import { expect, test } from '@playwright/test';

test('camera keeps coverage on resize and retains manual pause across bfcache lifecycle', async ({
  page,
}) => {
  await page.goto('/ar/');
  const hero = page.locator('.hero');
  await expect(hero).toHaveAttribute('data-cinematic', 'running');
  for (const width of [1920, 1440, 768, 390, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await hero.evaluate((el) => {
        const image = el.querySelector('img')!.getBoundingClientRect();
        const box = el.getBoundingClientRect();
        return (
          image.left <= box.left + 1 &&
          image.right >= box.right - 1 &&
          image.top <= box.top + 1 &&
          image.bottom >= box.bottom - 1
        );
      }),
    ).toBe(true);
  }
  await hero.locator('[data-hero-motion-toggle]').click();
  await page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect(hero.locator('[data-hero-motion-toggle]')).toHaveAttribute('aria-pressed', 'true');
  await expect(hero).toHaveAttribute('data-cinematic', 'paused');
});

for (const locale of ['ar', 'en']) {
  for (const width of [320, 375, 390, 768, 1440, 1920]) {
    test(`${locale} cinematic Hero is continuous, controllable and stable at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/`);
      const hero = page.locator('.hero');
      const image = hero.locator('.hero-camera');
      const toggle = hero.locator('[data-hero-motion-toggle]');
      await page.evaluate(() => document.fonts.ready);
      await expect(hero).toHaveAttribute('data-cinematic', 'running');
      await expect(toggle).toBeEnabled();
      await expect(image).toHaveCSS('animation-play-state', 'running');
      const sample = () =>
        hero.evaluate((el) => {
          const title = el.querySelector('h1')!.getBoundingClientRect();
          const cta = el.querySelector('.button-gold')!.getBoundingClientRect();
          return {
            title: title.toJSON(),
            cta: cta.toJSON(),
            height: el.getBoundingClientRect().height,
          };
        });
      // Wait for the existing first-paint text entrance, then sample real CSS motion.
      await expect
        .poll(() =>
          hero.evaluate(
            (el) => el.querySelector('.hero-content')!.getAnimations({ subtree: true }).length,
          ),
        )
        .toBe(0);
      const geometry = await sample();
      const start = await image.evaluate((el) => getComputedStyle(el).transform);
      await expect
        .poll(() => image.evaluate((el) => getComputedStyle(el).transform))
        .not.toBe(start);
      expect(await sample()).toEqual(geometry);
      // Keyboard access pauses the current frame, rather than resetting it.
      await toggle.focus();
      await page.keyboard.press('Space');
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(image).toHaveCSS('animation-play-state', 'paused');
      const frozen = await image.evaluate((el) => getComputedStyle(el).transform);
      await page.waitForTimeout(200);
      expect(await image.evaluate((el) => getComputedStyle(el).transform)).toBe(frozen);
      await page.keyboard.press('Space');
      await expect(image).toHaveCSS('animation-play-state', 'running');
      await page
        .locator('#memberships')
        .evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
      await expect(hero).toHaveAttribute('data-cinematic', 'paused');
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await expect(hero).toHaveAttribute('data-cinematic', 'running');
      // Seek two complete loops; the evidence run separately observes two real-time cycles.
      const bounds = await image.evaluate((el) => {
        const animation = el.getAnimations()[0];
        animation.pause();
        const timing = animation.effect!.getTiming();
        const duration = Number(timing.duration);
        const states = [0, 0.5, 1, 1.5, 2].map((cycle) => {
          animation.currentTime = Number(timing.delay) + duration * cycle;
          const rect = el.getBoundingClientRect();
          const section = el.closest('.hero')!.getBoundingClientRect();
          return {
            transform: getComputedStyle(el).transform,
            covers:
              rect.left <= section.left + 1 &&
              rect.right >= section.right - 1 &&
              rect.top <= section.top + 1 &&
              rect.bottom >= section.bottom - 1,
          };
        });
        animation.play();
        return states;
      });
      expect(bounds.every((state) => state.covers)).toBe(true);
      expect(bounds[0].transform).toBe(bounds[4].transform);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(hero).toHaveAttribute('data-cinematic', 'paused');
      expect(await hero.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
      await expect(image).toHaveCSS('transform', 'none');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }
}

test('cinematic lifecycle pauses hidden documents and observer failure stays static', async ({
  page,
}) => {
  await page.goto('/ar/');
  await expect(page.locator('.hero')).toHaveAttribute('data-cinematic', 'running');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.hero')).toHaveAttribute('data-cinematic', 'paused');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.hero')).toHaveAttribute('data-cinematic', 'running');
  await page.addInitScript(() => {
    window.IntersectionObserver = class {
      constructor() {
        throw new Error('test observer failure');
      }
    } as unknown as typeof IntersectionObserver;
  });
  await page.reload();
  await expect(page.locator('.hero-camera')).toHaveCSS('animation-play-state', 'paused');
  await expect(page.locator('[data-hero-motion-toggle]')).toBeDisabled();
});
