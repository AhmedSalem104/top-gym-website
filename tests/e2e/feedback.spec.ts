import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { feedbackCopy } from '../../src/i18n/feedback';

async function fillRequired(page: Page) {
  await page.locator('.feedback-star').nth(3).click();
  await page.locator('.feedback-topic').first().click();
  await page
    .locator('#feedback-message')
    .fill('تجربة جميلة — This is a clearly labeled browser test.');
}
for (const locale of ['ar', 'en'] as const) {
  for (const width of [320, 390, 768, 1440]) {
    test(
      locale + ' feedback is accessible and submits only after server acceptance at ' + width,
      async ({ page }, info) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const requests: { body: Record<string, unknown>; key: string }[] = [];
        let accept!: () => void;
        await page.route('**/api/feedback/', async (route) => {
          if (route.request().method() === 'GET')
            return route.fulfill({ json: { available: true } });
          requests.push({
            body: route.request().postDataJSON(),
            key: route.request().headers()['idempotency-key'],
          });
          await new Promise<void>((resolve) => {
            accept = resolve;
          });
          await route.fulfill({ json: { status: 'accepted' } });
        });
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('/' + locale + '/#feedback');
        await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
        const form = page.locator('[data-feedback-form]');
        const button = form.locator('[data-feedback-submit]');
        const status = form.locator('[data-feedback-status]');
        await expect(button).toBeEnabled();
        await button.click();
        await expect(form.locator('[name="rating"]').first()).toBeFocused();
        expect(requests).toHaveLength(0);
        await fillRequired(page);
        await page.locator('.feedback-details summary').click();
        await form.locator('[name="email"]').fill('invalid');
        await button.click();
        await expect(form.locator('[data-error="email"]')).toHaveText(
          feedbackCopy[locale].errors.email,
        );
        await form.locator('[name="email"]').fill('customer@example.test');
        await form.locator('[name="name"]').fill('Sample Customer');
        await form.locator('[name="replyRequested"]').check();
        await expect(form.locator('[data-rating-description]')).toHaveText(
          feedbackCopy[locale].ratings[3],
        );
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await button.click();
        await expect(form).toHaveAttribute('aria-busy', 'true');
        await expect(button).toBeDisabled();
        await expect(status).toHaveAttribute('data-state', 'loading');
        expect(requests).toHaveLength(1);
        expect(requests[0].body).toMatchObject({
          locale,
          rating: 4,
          categories: ['equipment'],
          name: 'Sample Customer',
          replyRequested: true,
        });
        expect(requests[0].key).toMatch(/^[0-9a-f-]{36}$/);
        accept();
        await expect(status).toHaveAttribute('data-state', 'success');
        await expect(status).toContainText(feedbackCopy[locale].success);
        await expect(status).toBeFocused();
        expect(requests).toHaveLength(1);
        expect(errors).toEqual([]);
        expect((await new AxeBuilder({ page }).include('#feedback').analyze()).violations).toEqual(
          [],
        );
        await page
          .locator('#feedback')
          .screenshot({ path: info.outputPath('feedback-' + locale + '-' + width + '.png') });
      },
    );
  }
}
test('feedback unavailable state is honest and no submit is attempted', async ({ page }) => {
  await page.route('**/api/feedback/', (route) => route.fulfill({ json: { available: false } }));
  await page.goto('/en/#feedback');
  await expect(page.locator('[data-feedback-submit]')).toBeDisabled();
  await expect(page.locator('[data-feedback-status]')).toHaveText(
    feedbackCopy.en.errors.unavailable,
  );
});
for (const failure of ['network', 'unavailable', 'rate_limited'] as const) {
  test(
    'feedback ' + failure + ' retry keeps the idempotency key and exact payload',
    async ({ page }) => {
      const submissions: { body: string | null; key: string }[] = [];
      await page.route('**/api/feedback/', async (route) => {
        if (route.request().method() === 'GET') return route.fulfill({ json: { available: true } });
        submissions.push({
          body: route.request().postData(),
          key: route.request().headers()['idempotency-key'],
        });
        if (submissions.length === 1) {
          if (failure === 'network') return route.abort('failed');
          return route.fulfill({
            status: failure === 'rate_limited' ? 429 : 503,
            json: { code: failure },
          });
        }
        return route.fulfill({ json: { status: 'accepted' } });
      });
      await page.goto('/en/#feedback');
      await fillRequired(page);
      await page.locator('[data-feedback-submit]').click();
      await expect(page.locator('[data-feedback-status]')).toHaveText(
        feedbackCopy.en.errors[failure],
      );
      await expect(page.locator('#feedback-message')).toBeDisabled();
      await page.locator('[data-feedback-submit]').click();
      await expect(page.locator('[data-feedback-status]')).toHaveAttribute('data-state', 'success');
      expect(submissions).toHaveLength(2);
      expect(submissions[1]).toEqual(submissions[0]);
    },
  );
}
test('feedback keyboard stars, topic selection and mobile navigation are discoverable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/feedback/', (route) => route.fulfill({ json: { available: true } }));
  await page.goto('/en/');
  await page.locator('.menu-toggle').click();
  await page.locator('#mobile-nav a[href="#feedback"]').click();
  await expect(page).toHaveURL(/#feedback$/);
  await expect(page.locator('#mobile-nav')).toBeHidden();
  const first = page.locator('[name="rating"]').first();
  await first.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[name="rating"]').nth(1)).toBeChecked();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await expect(page.locator('[name="categories"]').first()).toBeChecked();
  await expect(page.locator('.footer-navigation a[href="#feedback"]')).toHaveCount(1);
});
test('uncertain SMTP outcome is never displayed as success or silently retried', async ({
  page,
}) => {
  await page.route('**/api/feedback/', (route) =>
    route.fulfill(
      route.request().method() === 'GET'
        ? { json: { available: true } }
        : { status: 503, json: { code: 'uncertain' } },
    ),
  );
  await page.goto('/en/#feedback');
  await fillRequired(page);
  await page.locator('[data-feedback-submit]').click();
  await expect(page.locator('[data-feedback-status]')).toHaveText(feedbackCopy.en.errors.uncertain);
  await expect(page.locator('[data-feedback-submit]')).toBeDisabled();
});
