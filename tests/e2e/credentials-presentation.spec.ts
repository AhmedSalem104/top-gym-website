import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { publicCredentials } from '../../src/config/business';

for (const locale of ['ar', 'en'] as const) {
  for (const width of [390, 768, 1440]) {
    test(`${locale} certificate gallery preserves documents and keyboard enlargement at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/#credentials`);
      await page.evaluate(() => document.fonts.ready);
      const section = page.locator('#credentials');
      await expect(section.locator('h2')).toHaveCount(1);
      await expect(section.locator('.credential-card')).toHaveCount(publicCredentials.length);
      const columns = await section
        .locator('.credential-grid')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      expect(columns).toBe(width >= 1101 ? 3 : width >= 768 ? 2 : 1);
      for (const [index, credential] of publicCredentials.entries()) {
        const card = section.locator('.credential-card').nth(index);
        await expect(card.locator('h3')).toHaveText(credential.title[locale]);
        await expect(card.locator('.credential-issuer')).toHaveText(credential.issuer);
        const image = card.locator('img');
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveJSProperty('complete', true);
        await expect(image).not.toHaveJSProperty('naturalWidth', 0);
        await expect(image).toHaveAttribute('src', credential.preview);
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
        await page.keyboard.press('Escape');
        await expect(page.locator('#lightbox')).toBeHidden();
        await expect(link).toBeFocused();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const audit = await new AxeBuilder({ page }).include('#credentials').analyze();
      expect(audit.violations).toEqual([]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await section.scrollIntoViewIfNeeded();
      await expect(section.locator('.credentials-intro')).toBeVisible();
      await expect(page.locator('.hero-photo-note')).toHaveCount(0);
      await expect(page.locator('#about .section-description')).toHaveCount(0);
    });
  }
}
