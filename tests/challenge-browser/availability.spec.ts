import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { challengeCopy } from '../../src/i18n/challenge';
import { business } from '../../src/config/business';

for (const locale of ['ar', 'en'] as const)
  for (const width of [320, 390, 768, 1440])
    test(`${locale} ${width}: closed admissions remain visible with useful actions`, async ({
      page,
    }) => {
      const c = challengeCopy[locale];
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/challenge/v1/challenge/info', (route) =>
        route.fulfill({ json: { available: false, terms: null, mode: 'live' } }),
      );
      await page.goto(`/${locale}/`);
      const launcher = page.locator('[data-challenge-open]');
      await expect(launcher).toBeVisible();
      await launcher.focus();
      await page.keyboard.press('Enter');
      const dialog = page.locator('#challenge-dialog');
      await expect(dialog.getByRole('heading', { name: c.unavailableTitle })).toBeVisible();
      await expect(dialog.locator('form')).toHaveCount(0);
      await expect(dialog.getByRole('link', { name: c.callGym })).toHaveAttribute(
        'href',
        `tel:${business.contacts[0].phone}`,
      );
      expect((await dialog.boundingBox())!.height).toBeLessThan(500);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).include('#challenge-dialog').analyze()).violations,
      ).toEqual([]);
      await dialog.screenshot({
        path: `.local/challenge-visibility/closed-${locale}-${width}.png`,
      });
      await dialog.getByRole('button', { name: c.availabilityRetry }).click();
      await expect(dialog).toHaveAttribute('data-step', 'unavailable');
      await page.keyboard.press('Escape');
      await expect(launcher).toBeFocused();
      await launcher.click();
      await dialog.getByRole('link', { name: c.memberships }).click();
      await expect(dialog).not.toBeVisible();
      await expect(page).toHaveURL(/#memberships$/);
      await expect(page.locator('#memberships')).toBeFocused();
    });

test('availability retry reloads readiness instead of requiring a nonexistent session', async ({
  page,
}) => {
  await page.route('**/api/challenge/v1/challenge/info', (route) => route.abort());
  await page.goto('/en/');
  await page.locator('[data-challenge-open]').click();
  await expect(page.locator('[data-challenge-status]')).not.toBeEmpty();
  await page.unroute('**/api/challenge/v1/challenge/info');
  await page.getByRole('button', { name: challengeCopy.en.availabilityRetry }).click();
  await expect(page.locator('#challenge-dialog input[name=phone]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-challenge-open]')).toBeFocused();
});

test('closed admissions still restore an existing result', async ({ page }) => {
  await page.route('**/api/challenge/v1/challenge/info', (route) =>
    route.fulfill({ json: { available: false, terms: null, mode: 'live' } }),
  );
  await page.route('**/api/challenge/v1/challenge/sync', (route) =>
    route.fulfill({
      json: {
        status: 'registered',
        maskedPhone: '01******123',
        serverNow: Date.now(),
        score: 0,
        discount: 0,
        coupon: null,
      },
    }),
  );
  await page.goto('/en/');
  await page.locator('[data-challenge-open]').click();
  await expect(page.locator('.challenge-result-value')).toHaveText('0%');
  await expect(page.locator('.challenge-coupon')).toHaveCount(0);
  await expect(page.locator('#challenge-title')).toHaveText(challengeCopy.en.title);
});
