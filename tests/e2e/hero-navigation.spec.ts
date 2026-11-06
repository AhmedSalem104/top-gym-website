import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { business } from '../../src/config/business';
import { t } from '../../src/i18n';

for (const locale of ['ar', 'en']) {
  for (const width of [320, 375, 390, 768, 1366, 1440, 1920]) {
    test(`${locale} hero composition and working actions at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width <= 320 ? 740 : width < 768 ? 844 : 900 });
      await page.goto(`/${locale}/`);
      await page.evaluate(() => document.fonts.ready);
      const hero = page.locator('.hero');
      await expect(hero.locator('.hero-label bdi')).toHaveText(business.name);
      await expect(hero.locator('.hero-description')).toHaveText(t(locale as 'ar' | 'en').heroText);
      await expect(hero.locator('.hero-services')).toHaveCount(0);
      await expect(hero).not.toContainText('💪');
      const image = hero.locator('img');
      await expect(image).toHaveJSProperty('complete', true);
      await expect(image).not.toHaveJSProperty('naturalWidth', 0);
      await expect(image).toHaveAttribute('loading', 'eager');
      await expect(image).toHaveAttribute('fetchpriority', 'high');
      await expect(image).toHaveCSS('object-fit', 'cover');
      expect(await image.evaluate((el: HTMLImageElement) => el.currentSrc)).toMatch(
        width < 768 ? /top-gym-hero-mobile-/ : /top-gym-hero-wide-/,
      );
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      const geometry = await hero.evaluate((el) => {
        const title = el.querySelector('h1')!;
        const section = el.getBoundingClientRect();
        // The root box excludes the existing stable scrollbar gutter; clientWidth
        // includes that reserved strip in headless Chromium with overlay scrollbars.
        const pageBox = document.documentElement.getBoundingClientRect();
        const content = el.querySelector('.hero-content')!.getBoundingClientRect();
        const container = el.querySelector('.hero-layout')!.getBoundingClientRect();
        const image = el.querySelector('img')!.getBoundingClientRect();
        const heading = title.getBoundingClientRect();
        const primary = el.querySelector('.button-gold')!.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          titleOverflow: title.scrollWidth > title.clientWidth,
          overlap:
            heading.left < image.right &&
            heading.right > image.left &&
            heading.top < image.bottom &&
            heading.bottom > image.top,
          primaryBottom: primary.bottom,
          viewportHeight: innerHeight,
          fullBleed:
            image.left <= section.left + 1 &&
            image.right >= section.right - 1 &&
            image.top <= section.top + 1 &&
            image.bottom >= section.bottom - 1 &&
            Math.abs(section.left - pageBox.left) <= 1 &&
            Math.abs(section.right - pageBox.right) <= 1,
          alignedToReadingEdge:
            document.dir === 'rtl'
              ? Math.abs(content.right - container.right) < 1
              : Math.abs(content.left - container.left) < 1,
          belowHeader:
            heading.top >= document.querySelector('.site-header')!.getBoundingClientRect().bottom,
          lineCount: title.querySelectorAll('span, em').length,
        };
      });
      expect(geometry.overflow).toBe(false);
      expect(geometry.titleOverflow).toBe(false);
      expect(geometry.overlap).toBe(true);
      expect(geometry.fullBleed).toBe(true);
      expect(geometry.alignedToReadingEdge).toBe(true);
      expect(geometry.belowHeader).toBe(true);
      expect(geometry.primaryBottom).toBeLessThan(geometry.viewportHeight - 64);
      expect(geometry.lineCount).toBe(2);
      await expect(hero.locator('.button-dark')).toHaveAttribute('href', business.links.maps);
      await expect(hero.locator('.button-dark')).toHaveAttribute('rel', 'noopener noreferrer');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const heroAudit = await new AxeBuilder({ page }).include('.hero').analyze();
      expect(heroAudit.violations).toEqual([]);
      expect(await hero.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await hero.locator('.button-gold').click();
      await expect(page).toHaveURL(/#memberships$/);
      await expect
        .poll(() =>
          page.locator('#memberships').evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
        )
        .toBeLessThan(150);
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await hero.locator('.text-link').click();
      await expect(page).toHaveURL(/#gallery$/);
      await expect
        .poll(() =>
          page.locator('#gallery').evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
        )
        .toBeLessThan(150);
    });
  }
  for (const width of [390, 768, 1440]) {
    test(`${locale} header inverts only past hero, Home restores top at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/`);
      await page.evaluate(() => document.fonts.ready);
      const header = page.locator('.site-header');
      const height = (await header.boundingBox())!.height;
      await expect(header).not.toHaveClass(/is-scrolled/);
      await expect(page.locator('.desktop-nav [aria-current]')).toHaveAttribute('href', '#top');
      const end = await page
        .locator('.hero')
        .evaluate((el) => scrollY + el.getBoundingClientRect().bottom);
      await page.evaluate((y) => scrollTo({ top: y - 20, behavior: 'instant' }), end);
      await expect(header).not.toHaveClass(/is-scrolled/);
      await page.evaluate((y) => scrollTo({ top: y + 20, behavior: 'instant' }), end);
      await expect(header).toHaveClass(/is-scrolled/);
      await expect(header).toHaveCSS('background-color', 'rgb(255, 173, 38)');
      expect((await header.boundingBox())!.height).toBe(height);
      if (width < 1360) {
        // Click the sticky control in-place; locator auto-scroll moves its document ancestor.
        const bounds = (await page.locator('.menu-toggle').boundingBox())!;
        await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      }
      const nav = page.locator(width < 1360 ? '#mobile-nav' : '.desktop-nav');
      const home = nav.locator('[href="#top"]');
      await expect(home).toHaveText(locale === 'ar' ? 'الرئيسية' : 'Home');
      await expect(home).toHaveCSS('color', 'rgb(0, 0, 0)');
      const axe = await new AxeBuilder({ page }).include('.site-header').analyze();
      expect(axe.violations).toEqual([]);
      // Avoid the browser's separate smooth focus-scroll competing with anchor navigation.
      await home.evaluate((el: HTMLAnchorElement) => el.focus({ preventScroll: true }));
      await page.keyboard.press('Shift');
      await expect(home).toBeFocused();
      await expect(home).toHaveCSS('outline-color', 'rgb(0, 0, 0)');
      await page.keyboard.press('Enter');
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await expect(header).not.toHaveClass(/is-scrolled/);
      if (width < 1360) await expect(nav).toBeHidden();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(header).toHaveCSS('transition-duration', '0s');
      await page.evaluate((y) => scrollTo({ top: y + 20, behavior: 'instant' }), end);
      await expect(header).toHaveCSS('background-color', 'rgb(255, 173, 38)');
      await page.reload();
      await expect(page.locator('.desktop-nav [aria-current]')).toHaveAttribute('href', '#top');
    });
  }
}
