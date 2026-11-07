import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { challengeCopy } from '../../src/i18n/challenge';

for (const locale of ['ar', 'en'] as const)
  for (const width of [320, 390, 768, 1440])
    test(`${locale} ${width}: five logo clicks open the password dialog`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${locale}/`);
      const logo = page.locator('[data-admin-logo]');
      const dialog = page.locator('#admin-access-dialog');
      for (let i = 0; i < 4; i++) await logo.click();
      await expect(page).toHaveURL(/#top$/);
      await expect(dialog).not.toBeVisible();
      await logo.click();
      await expect(dialog).toBeVisible();
      const input = dialog.locator('input');
      await expect(input).toHaveCount(1);
      await expect(input).toHaveAttribute('type', 'password');
      await expect(input).toBeFocused();
      await expect(page.locator('[data-admin-entry]')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect((await dialog.boundingBox())!.height).toBeLessThan(600);
      expect(
        (await new AxeBuilder({ page }).include('#admin-access-dialog').analyze()).violations,
      ).toEqual([]);
      await dialog.screenshot({ path: `.local/admin-access/dialog-${locale}-${width}.png` });
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
      }
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(logo).toBeFocused();
      await expect(page.locator('body')).not.toHaveClass(/dialog-open/);
    });

test('touch entry, visibility toggle, wrong password and retry', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4340',
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  try {
    await page.goto('/ar/');
    for (let i = 0; i < 5; i++) await page.locator('[data-admin-logo] img').tap();
    const dialog = page.locator('#admin-access-dialog');
    const input = dialog.getByLabel(challengeCopy.ar.password, { exact: true });
    await input.fill('wrong-local-test');
    await dialog.getByRole('button', { name: challengeCopy.ar.accessShow }).tap();
    await expect(input).toHaveAttribute('type', 'text');
    await dialog.getByRole('button', { name: challengeCopy.ar.accessHide }).tap();
    // Isolate UI error checks from the shared real-login rate-limit fixture.
    await page.route('**/api/challenge/v1/admin/access', (r) =>
      r.fulfill({ status: 401, json: { code: 'invalid_login' } }),
    );
    await dialog.getByRole('button', { name: challengeCopy.ar.accessSubmit }).tap();
    await expect(dialog.getByRole('status')).toHaveText(challengeCopy.ar.accessInvalid);
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await page.unroute('**/api/challenge/v1/admin/access');
    await input.fill('Local-test-password-only!');
    await dialog.getByRole('button', { name: challengeCopy.ar.accessSubmit }).tap();
    await expect(page).toHaveURL(/\/ar\/challenge-admin\/$/);
    await expect(page.locator('.challenge-admin-kpis')).toBeVisible();
    await page.getByRole('button', { name: challengeCopy.ar.logout }).tap();
    await expect(page.locator('input[type=password]')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('nonconsecutive clicks reset; keyboard can open; cancel discards late responses', async ({
  page,
}) => {
  await page.goto('/en/');
  const logo = page.locator('[data-admin-logo]');
  const dialog = page.locator('#admin-access-dialog');
  for (let i = 0; i < 3; i++) await logo.click();
  await page.locator('h1').click();
  for (let i = 0; i < 2; i++) await logo.click();
  await expect(dialog).not.toBeVisible();
  await page.waitForTimeout(2600);
  await logo.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');
  await expect(dialog).not.toBeVisible();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/challenge/v1/admin/access', async (route) => {
    await pending;
    await route.fulfill({ json: { csrf: 'mock-only', role: 'owner' } });
  });
  await dialog.getByLabel('Password', { exact: true }).fill('Local-test-password-only!');
  await dialog.getByRole('button', { name: 'Open dashboard' }).click();
  await expect(dialog.locator('form')).toHaveAttribute('aria-busy', 'true');
  await page.keyboard.press('Escape');
  release();
  await expect(dialog.locator('input')).toHaveCount(0);
  await page.waitForTimeout(200);
  await expect(page).toHaveURL(/\/en\/#top$/);
  await expect(logo).toBeFocused();
});
