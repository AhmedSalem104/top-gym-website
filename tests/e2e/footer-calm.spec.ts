import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { business } from '../../src/config/business';

test('mobile menu reversal resumes its painted frame without opacity jumps', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  const samples = await page.evaluate(async () => {
    const menu = document.querySelector<HTMLElement>('#mobile-nav')!;
    const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle')!;
    const samples = [];
    toggle.click();
    await new Promise((resolve) => setTimeout(resolve, 70));
    for (let i = 0; i < 2; i++) {
      const before = Number(getComputedStyle(menu).opacity);
      toggle.click();
      const effect = menu.getAnimations()[0]?.effect as KeyframeEffect;
      samples.push({ before, from: Number(effect.getKeyframes()[0].opacity) });
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    return samples;
  });
  for (const sample of samples) expect(Math.abs(sample.before - sample.from)).toBeLessThan(0.01);
  await expect(page.locator('#mobile-nav')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-nav')).toBeHidden();
});

for (const locale of ['ar', 'en'] as const) {
  for (const width of [390, 768, 1440]) {
    test(`${locale} premium footer links, hours, focus and responsive layout at ${width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${locale}/`);
      const footer = page.locator('.site-footer');
      const cta = page.locator('.final-cta');
      await expect(cta.locator('h2')).toHaveText(
        locale === 'ar' ? 'جاهز تبدأ رحلتك' : 'READY TO START YOUR JOURNEY?',
      );
      await expect(cta.locator('a[href="#memberships"]')).toBeAttached();
      await expect(cta.locator(`a[href="tel:${business.contacts[0].phone}"]`)).toBeAttached();
      await expect(cta.locator(`a[href="${business.links.maps}"]`)).toBeAttached();
      const links = footer.locator('.footer-navigation a');
      await expect(links).toHaveCount(8);
      for (const link of await links.all()) {
        const href = (await link.getAttribute('href'))!;
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${href}$`));
        expect(
          await page.locator(href).evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
        ).toBeLessThan(160);
      }
      for (const contact of business.contacts) {
        const phone = footer.locator(`a[href="tel:${contact.phone}"]`);
        await expect(phone).toContainText(contact.name[locale]);
        await expect(phone).toContainText(contact.phone);
      }
      for (const url of [
        business.links.facebook,
        business.links.whatsappGroup,
        business.links.maps,
      ]) {
        const link = footer.locator(`a[href="${url}"]`);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      await expect(footer.locator(`a[href="${business.links.whatsappGroup}"]`)).toContainText(
        locale === 'ar' ? 'جروب' : 'Group',
      );
      await expect(footer.locator('[data-footer-hours="780-1440"]')).toContainText(
        locale === 'ar' ? 'اليوم التالي' : 'next day',
      );
      await expect(footer.locator('[data-footer-hours="960-1320"]')).toContainText(
        locale === 'ar' ? 'الجمعة' : 'Friday',
      );
      await expect(footer.locator('.footer-hours-note')).not.toBeEmpty();
      await expect(footer.locator('[data-year]')).toHaveText(
        new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: business.timezone }).format(
          new Date(),
        ),
      );
      expect(
        await page
          .locator('.footer-grid')
          .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length),
      ).toBe(width === 1440 ? 4 : width === 768 ? 2 : 1);
      const top = footer.locator('[data-back-top]');
      await top.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(top).toBeFocused();
      expect(await top.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
      await page.keyboard.press('Enter');
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const audit = await new AxeBuilder({ page })
        .include('.site-footer')
        .include('.final-cta')
        .analyze();
      expect(audit.violations).toEqual([]);
      await footer.screenshot({ path: info.outputPath(`footer-${locale}-${width}.png`) });
    });
  }
  test(`${locale} motion never re-hides painted content on fast anchors and slow entry fades once`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      Object.assign(window, { visibleResets: [] as string[] });
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        const rect = this.getBoundingClientRect();
        if (
          this.hasAttribute('data-motion') &&
          Array.isArray(frames) &&
          frames[0]?.opacity === 0 &&
          rect.top < innerHeight &&
          rect.bottom > 0
        )
          (window as unknown as { visibleResets: string[] }).visibleResets.push(this.className);
        return animate.call(this, frames, options);
      };
    });
    await page.goto(`/${locale}/`);
    const grid = page.locator('.facility-grid');
    await grid.evaluate((el) =>
      window.scrollTo({
        top: scrollY + el.getBoundingClientRect().top - innerHeight - 40,
        behavior: 'instant',
      }),
    );
    await page.waitForTimeout(100);
    await grid.evaluate(() => window.scrollBy({ top: 28, behavior: 'instant' }));
    await expect(grid.locator('[data-motion-state="running"]').first()).toBeAttached();
    await page.waitForTimeout(900);
    for (const id of ['memberships', 'gallery', 'contact', 'about']) {
      await page.locator(`#${id}`).evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
      await page.waitForTimeout(100);
    }
    expect(
      await page.evaluate(() => (window as unknown as { visibleResets: string[] }).visibleResets),
    ).toEqual([]);
    await grid.scrollIntoViewIfNeeded();
    await expect(grid.locator('[data-motion-state="running"]')).toHaveCount(0);
  });
}

test('spotlight initial placement is already aligned before its first transition', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    Object.assign(window, { initialSpotlightError: null });
    const observer = new MutationObserver(() => {
      const light = document.querySelector<HTMLElement>('.nav-spotlight[data-visible="true"]');
      const link = document.querySelector<HTMLElement>('.desktop-nav [aria-current]');
      if (!light || !link) return;
      const a = light.getBoundingClientRect(),
        b = link.getBoundingClientRect();
      Object.assign(window, {
        initialSpotlightError: Math.abs(a.x + a.width / 2 - b.x - b.width / 2),
      });
      observer.disconnect();
    });
    observer.observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-visible'],
    });
  });
  await page.goto('/ar/#memberships');
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { initialSpotlightError: number | null }).initialSpotlightError,
      ),
    )
    .not.toBeNull();
  expect(
    await page.evaluate(
      () => (window as unknown as { initialSpotlightError: number }).initialSpotlightError,
    ),
  ).toBeLessThan(2);
});
