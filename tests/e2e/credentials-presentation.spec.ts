import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { business, publicCredentials } from '../../src/config/business';

for (const locale of ['ar', 'en'] as const) {
  for (const width of [320, 390, 768, 1440, 1920]) {
    test(`${locale} certificate gallery preserves documents and keyboard enlargement at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`/${locale}/#credentials`);
      await page.evaluate(() => document.fonts.ready);
      const section = page.locator('#credentials');
      await expect(section.locator('h2')).toHaveCount(1);
      await expect(section.locator('.credential-holder bdi')).toHaveText(business.trainer.name);
      await expect(section.locator('.credential-card')).toHaveCount(publicCredentials.length);
      const columns = await section
        .locator('.credential-grid')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      expect(columns).toBe(width >= 1101 ? 12 : width >= 768 ? 4 : 1);
      const geometry = await section.evaluate((el) => {
        const grid = el.querySelector('.credential-grid')!.getBoundingClientRect();
        const cards = [...el.querySelectorAll<HTMLElement>('.credential-card')];
        return {
          center: grid.left + grid.width / 2,
          cards: cards.map((card) => ({
            top: card.offsetTop,
            height: card.offsetHeight,
            left: card.getBoundingClientRect().left,
            right: card.getBoundingClientRect().right,
          })),
        };
      });
      if (width >= 768) {
        expect(new Set(geometry.cards.map((card) => card.height)).size).toBe(1);
        const lastRow = geometry.cards.filter((card) => card.top === geometry.cards.at(-1)!.top);
        expect(lastRow).toHaveLength(width >= 1101 ? 2 : 1);
        const center =
          (Math.min(...lastRow.map((card) => card.left)) +
            Math.max(...lastRow.map((card) => card.right))) /
          2;
        expect(Math.abs(center - geometry.center)).toBeLessThan(1);
      }
      for (const [index, credential] of publicCredentials.entries()) {
        const card = section.locator('.credential-card').nth(index);
        await expect(card.locator('h3')).toHaveText(credential.title[locale]);
        await expect(card.locator('.credential-issuer')).toHaveText(credential.issuer);
        const image = card.locator('img');
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveJSProperty('complete', true);
        await expect(image).not.toHaveJSProperty('naturalWidth', 0);
        await expect(image).toHaveAttribute('src', credential.preview);
        await expect(image).toHaveAttribute('srcset', /320w.*680w.*960w/);
        await expect(image).toHaveCSS('object-fit', 'contain');
        await expect(card.locator('time').first()).toHaveAttribute(
          'datetime',
          credential.period.start,
        );
        await expect(card.locator('time').last()).toHaveAttribute(
          'datetime',
          credential.period.end,
        );
        const link = card.locator('.credential-preview');
        await expect(link).toHaveAttribute('href', credential.image);
        await link.focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('#lightbox')).toBeVisible();
        await expect(page.locator('#lightbox-image')).toHaveAttribute(
          'src',
          new URL(credential.image, page.url()).href,
        );
        if (index === 0) {
          const zoom = page.locator('[data-lightbox-zoom]');
          await expect(zoom).toBeEnabled();
          await zoom.click();
          await expect(zoom).toHaveAttribute('aria-pressed', 'true');
          const stage = page.locator('#lightbox-stage');
          expect(
            await stage.evaluate(
              (el) => el.scrollWidth > el.clientWidth && el.scrollHeight > el.clientHeight,
            ),
          ).toBe(true);
          await stage.focus();
          await page.keyboard.press('ArrowDown');
          await expect.poll(() => stage.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
          await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
          await expect(page.locator('#lightbox-image')).toHaveAttribute(
            'src',
            new URL(credential.image, page.url()).href,
          );
          const modalAudit = await new AxeBuilder({ page }).include('#lightbox').analyze();
          expect(modalAudit.violations).toEqual([]);
          await zoom.click();
          await expect(zoom).toHaveAttribute('aria-pressed', 'false');
          await page.locator('[data-lightbox-next]').click();
          await expect(page.locator('#lightbox-image')).toHaveAttribute(
            'src',
            new URL(publicCredentials[1].image, page.url()).href,
          );
          await page.locator('[data-lightbox-prev]').click();
        }
        await page.keyboard.press('Escape');
        await expect(page.locator('#lightbox')).toBeHidden();
        await expect(link).toBeFocused();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const audit = await new AxeBuilder({ page }).include('#credentials').analyze();
      expect(audit.violations).toEqual([]);
      expect(errors).toEqual([]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await section.scrollIntoViewIfNeeded();
      await expect(section.locator('.credentials-intro')).toBeVisible();
      await expect(page.locator('.hero-photo-note')).toHaveCount(0);
      await expect(page.locator('#about .section-description')).toHaveCount(0);
    });
  }

  test(`${locale} certificate hover reverses smoothly, preserves document edges and respects reduced motion`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${locale}/#credentials`);
    const card = page.locator('.credential-card').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute('data-motion-state', 'complete');
    await page.mouse.move(0, 0);
    const offset = await card.evaluate((el) => (el as HTMLElement).offsetTop);
    const bounds = (await card.boundingBox())!;
    const samples = [];
    for (let index = 0; index < 8; index++) {
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 80);
      await page.waitForTimeout(40);
      samples.push(
        await card.evaluate((el) => ({
          translate: getComputedStyle(el).translate,
          top: (el as HTMLElement).offsetTop,
        })),
      );
      await page.mouse.move(0, 0);
      await page.waitForTimeout(40);
    }
    await expect(card).toHaveCSS('translate', 'none');
    await card.hover();
    await expect(card).toHaveCSS('translate', '0px -4px');
    await expect(card).toHaveCSS('border-color', 'rgb(229, 149, 0)');
    await expect(card.locator('img')).toHaveCSS('transform', 'matrix(1.025, 0, 0, 1.025, 0, 0)');
    await expect(card.locator('.credential-action-label')).toHaveCSS('opacity', '1');
    expect(
      await card.evaluate((el) => {
        const frame = el.querySelector('.credential-document')!.getBoundingClientRect();
        const image = el.querySelector('img')!.getBoundingClientRect();
        return (
          image.left > frame.left &&
          image.right < frame.right &&
          image.top > frame.top &&
          image.bottom < frame.bottom
        );
      }),
    ).toBe(true);
    expect(samples.every((sample) => sample.top === offset)).toBe(true);
    await testInfo.attach('hover-reversals', {
      body: JSON.stringify(samples),
      contentType: 'application/json',
    });
    await page.mouse.move(0, 0);
    await card.locator('a').focus();
    await expect(card.locator('.credential-action-label')).toHaveCSS('opacity', '1');
    await expect(card).toHaveCSS('translate', '0px -4px');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(card).toHaveCSS('translate', 'none');
    await expect(card.locator('img')).toHaveCSS('transform', 'none');
    await expect(card.locator('.credential-action-label')).toHaveCSS('opacity', '1');
    expect(await card.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(card).toHaveAttribute('data-motion-state', 'complete');
  });

  test(`${locale} certificate touch action stays discoverable and zoom closes safely`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await page.goto(`/${locale}/#credentials`);
      const card = page.locator('.credential-card').first();
      await card.scrollIntoViewIfNeeded();
      await expect(card.locator('.credential-action-label')).toHaveCSS('opacity', '1');
      await card.locator('a').tap();
      await expect(page.locator('#lightbox')).toBeVisible();
      const zoom = page.locator('[data-lightbox-zoom]');
      await expect(zoom).toBeEnabled();
      await zoom.tap();
      await expect(zoom).toHaveAttribute('aria-pressed', 'true');
      await page.locator('[data-lightbox-close]').tap();
      await expect(page.locator('#lightbox')).toBeHidden();
      await expect(card.locator('a')).toBeFocused();
      await expect(page.locator('body')).not.toHaveClass(/dialog-open/);
    } finally {
      await context.close();
    }
  });
}
