import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
const evidence = 'docs/evidence/challenge';
test.beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
});
test('gold invitation motion loops smoothly, stays stable, and disables with reduced motion', async ({
  page,
}) => {
  await mkdir('docs/evidence/challenge-entry', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ar/');
  const launch = page.locator('[data-challenge-open]');
  await expect(launch).toContainText('على قيمة اشتراكك');
  const before = await launch.boundingBox();
  const animation = await launch.evaluate((node) => {
    const style = getComputedStyle(node, '::before');
    return {
      name: style.animationName,
      duration: style.animationDuration,
      iterations: style.animationIterationCount,
    };
  });
  expect(animation).toEqual({
    name: 'challenge-invitation',
    duration: '3.2s',
    iterations: 'infinite',
  });
  await launch.hover();
  await page.waitForTimeout(4600);
  expect((await launch.boundingBox())!.width).toBe(before!.width);
  expect(
    await launch.evaluate(
      (node) =>
        node.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
    ),
  ).toBe(1);
  await launch.screenshot({ path: 'docs/evidence/challenge-entry/after-button-1440.png' });
  await page.screenshot({ path: 'docs/evidence/challenge-entry/after-landing-1440.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await launch.evaluate((node) => getComputedStyle(node, '::before').animationName)).toBe(
    'none',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await launch.screenshot({ path: 'docs/evidence/challenge-entry/after-button-390.png' });
  await page.screenshot({ path: 'docs/evidence/challenge-entry/after-landing-390.png' });
});
for (const locale of ['ar', 'en'])
  for (const width of [320, 390, 768, 1440]) {
    test(`${locale} ${width}: responsive intro, keyboard and reduced motion`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${locale}/`);
      const open = page.locator('[data-challenge-open]');
      await open.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#challenge-dialog')).toBeVisible();
      await expect(page.locator('#challenge-dialog input[type=tel]')).toBeVisible();
      await expect(page.locator('.challenge-intro')).toContainText(
        locale === 'ar' ? '١٠ ثوانٍ' : '10 seconds',
      );
      await expect(page.locator('#challenge-title')).toContainText(
        locale === 'ar' ? 'قيمة الاشتراك' : 'membership',
      );
      const bounds = await page.locator('#challenge-dialog').boundingBox();
      expect(bounds!.height).toBeLessThanOrEqual(622);
      expect(bounds!.width).toBeLessThanOrEqual(562);
      await expect(page.locator('#challenge-dialog input[name=code]')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const failures = await new AxeBuilder({ page }).include('#challenge-dialog').analyze();
      expect(failures.violations).toEqual([]);
      await page
        .locator('#challenge-dialog')
        .screenshot({ path: `${evidence}/intro-${locale}-${width}.png` });
      await page.keyboard.press('Escape');
      await expect(page.locator('#challenge-dialog')).not.toBeVisible();
      await expect(open).toBeFocused();
      expect(errors).toEqual([]);
    });
  }
for (const [index, locale] of ['ar', 'en'].entries())
  test(`${locale}: entered-phone attempt, real API scoring, private registration and recovery`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: locale === 'ar' ? 390 : 1440, height: 950 });
    if (locale === 'ar') await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}/`);
    await page.locator('[data-challenge-open]').click();
    const modal = page.locator('#challenge-dialog');
    await modal.locator('input[name=phone]').fill(`0101234567${index}`);
    await modal.locator('button[type=submit]').click();
    await expect(
      modal.getByText(locale === 'ar' ? 'رقم المشاركة' : 'Participation number', {
        exact: false,
      }),
    ).toBeVisible();
    await modal
      .getByRole('button', {
        name: locale === 'ar' ? 'جاهز؟ ابدأ التحدي' : 'Ready? Start the challenge',
      })
      .click();
    await expect(modal.locator('.challenge-options')).toBeVisible();
    await modal.screenshot({ path: `${evidence}/question-${locale}.png` });
    for (let i = 0; i < 3; i++) {
      await modal.getByRole('button', { name: locale === 'ar' ? /صحيح$/ : /Correct$/ }).click();
      if (i < 2) await expect(modal.locator('.challenge-progress')).toContainText(String(i + 2));
    }
    await expect(modal.locator('.challenge-result-value')).toHaveText('30%');
    if (locale === 'ar') await expect(modal.locator('.challenge-confetti')).toHaveCount(0);
    await modal
      .locator('input[name=name]')
      .fill(locale === 'ar' ? 'اختبار محلي' : 'Local test participant');
    await expect(modal.locator('input[name=email], input[name=code]')).toHaveCount(0);
    await modal.locator('input[type=checkbox]').first().check();
    await modal.locator('button[type=submit]').click();
    await expect(modal.locator('.challenge-coupon code')).toHaveText(/^TOP-[A-F0-9]{20}$/);
    const coupon = await modal.locator('.challenge-coupon code').innerText();
    await expect(modal.locator('.challenge-coupon p').nth(1)).toContainText(
      locale === 'ar' ? 'صالح حتى' : 'Valid until',
    );
    const whatsappUrl = new URL(
      (await modal.locator('.challenge-coupon-whatsapp').getAttribute('href'))!,
    );
    const whatsappCta = modal.locator('.challenge-coupon-whatsapp');
    await whatsappCta.hover();
    expect(await whatsappCta.evaluate((node) => getComputedStyle(node).color)).toBe(
      'rgb(11, 13, 15)',
    );
    expect(whatsappUrl.origin + whatsappUrl.pathname).toBe('https://wa.me/201015819700');
    expect(whatsappUrl.searchParams.get('text')).toContain(coupon);
    expect(whatsappUrl.searchParams.get('text')).toContain(
      locale === 'ar' ? '01012345670' : '01012345671',
    );
    expect(whatsappUrl.searchParams.get('text')).toContain(
      locale === 'ar' ? 'اختبار محلي' : 'Local test participant',
    );
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await modal
      .getByRole('button', { name: locale === 'ar' ? 'انسخ الكوبون' : 'Copy coupon' })
      .click();
    await expect(modal.locator('[data-challenge-status]')).toHaveText(
      locale === 'ar' ? 'تم نسخ الكوبون.' : 'Coupon copied.',
    );
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(coupon);
    await modal.screenshot({ path: `${evidence}/result-${locale}.png` });
    await page.reload();
    await page.locator('[data-challenge-open]').click();
    await expect(modal.locator('.challenge-coupon code')).toHaveText(coupon);
    expect(
      (await new AxeBuilder({ page }).include('#challenge-dialog').analyze()).violations,
    ).toEqual([]);
  });
test('server timeout survives closed modal and refresh; no zero-score coupon', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/en/');
  await page.locator('[data-challenge-open]').click();
  const modal = page.locator('#challenge-dialog');
  await modal.locator('input[name=phone]').fill('01012345672');
  await modal.locator('button[type=submit]').click();
  const started = page.waitForResponse((response) => response.url().endsWith('/challenge/start'));
  await modal.getByRole('button', { name: 'Ready? Start the challenge' }).click();
  const issued = (await (await started).json()).question;
  expect(issued.deadlineAt - issued.startsAt).toBe(10000);
  await expect(modal.locator('.challenge-question')).toBeVisible();
  await expect(modal.getByRole('timer')).toHaveText(/^(10|[1-9]) seconds$/);
  expect(
    await modal
      .locator('.challenge-timer-fill')
      .evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a),
  ).toBeLessThanOrEqual(1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(30500);
  await page.reload();
  await page.locator('[data-challenge-open]').click();
  await expect(modal.locator('.challenge-result-value')).toHaveText('0%');
  await expect(modal.locator('.challenge-coupon')).toHaveCount(0);
});
test('hidden entry requires real login, and admin searches and redeems once', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const post = async (path: string, data: unknown) => {
    const r = await request.post('/api/challenge/v1/' + path, {
      headers: { Origin: 'http://127.0.0.1:4340', 'Idempotency-Key': crypto.randomUUID() },
      data,
    });
    expect(r.ok()).toBe(true);
    return r.json();
  };
  await post('challenge/enroll', { phone: '01012345679' });
  let seeded = await post('challenge/start', { locale: 'en', attribution: {} });
  for (let i = 0; i < 3; i++)
    seeded = await post('challenge/answer', {
      question: seeded.question.id,
      option: seeded.question.options.find((o: { text: { en: string } }) => o.text.en === 'Correct')
        .id,
    });
  await post('challenge/finalize', {
    name: 'Admin seeded participant',
    consent: true,
  });
  await page.goto('/en/');
  const entry = page.locator('[data-admin-logo]');
  for (let i = 0; i < 5; i++) await entry.click();
  await expect(page.locator('input[type=password]')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('Local-test-password-only!');
  await page.getByRole('button', { name: 'Open dashboard' }).click();
  await expect(page.locator('.challenge-admin-kpis')).toBeVisible();
  await page.getByLabel('Search exact full name, phone or coupon').fill('Admin seeded participant');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  const participantRow = page.locator('tbody tr').first();
  await participantRow.getByRole('button', { name: 'Activate coupon' }).click();
  await expect(page.locator('.challenge-admin-activation')).toBeVisible();
  await page.screenshot({ path: `${evidence}/admin-activate-en-1440.png`, fullPage: true });
  await page
    .getByLabel('I have checked the terms and the coupon holder. This coupon cannot be used again.')
    .check();
  await page.getByRole('button', { name: 'Confirm redemption' }).click();
  await expect(page.locator('.challenge-admin-activation')).toHaveCount(0);
  await expect(page.locator('tbody tr').first().locator('td').nth(6)).toHaveText('Redeemed');
  await expect(page.getByRole('button', { name: 'Confirm redemption' })).toHaveCount(0);
  await page.screenshot({ path: `${evidence}/admin-en-1440.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/$/);
  await page.goto('/en/challenge-admin/');
  await expect(page.locator('input[type=password]')).toBeVisible();
});

test('slow CPU, failed answer recovery, timer authority and no layout shift on opening', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    (window as unknown as { challengeCLS: number }).challengeCLS = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        hadRecentInput: boolean;
        value: number;
      })[])
        if (!entry.hadRecentInput)
          (window as unknown as { challengeCLS: number }).challengeCLS += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/en/');
  await page.locator('[data-challenge-open]').click();
  const modal = page.locator('#challenge-dialog');
  await modal.locator('input[name=phone]').fill('01012345675');
  await modal.locator('button[type=submit]').click();
  await modal.getByRole('button', { name: 'Ready? Start the challenge' }).click();
  await page.route('**/api/challenge/v1/challenge/answer', (route) => route.abort());
  await modal.getByRole('button', { name: /Correct$/ }).click();
  await expect(modal.getByRole('button', { name: 'Recover current state' })).toBeVisible();
  await page.unroute('**/api/challenge/v1/challenge/answer');
  await modal.getByRole('button', { name: 'Recover current state' }).click();
  await expect(modal.locator('.challenge-options')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  const cls = await page.evaluate(
    () => (window as unknown as { challengeCLS: number }).challengeCLS,
  );
  await test.info().attach('local-performance', {
    body: JSON.stringify({
      cpuSlowdown: 4,
      viewport: 390,
      cls,
      note: 'Local Chromium sample; not field CWV or a throughput benchmark.',
    }),
    contentType: 'application/json',
  });
  expect(cls).toBeLessThan(0.1);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
});

test('Arabic administration, language switch and four responsive widths', async ({ page }) => {
  await page.goto('/ar/challenge-admin/');
  await page.getByLabel('كلمة المرور', { exact: true }).fill('Local-test-password-only!');
  await page.getByRole('button', { name: 'فتح لوحة البيانات' }).click();
  await expect(page.locator('.challenge-admin-kpis')).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `${evidence}/admin-ar-${width}.png`, fullPage: true });
  }
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('.challenge-admin-kpis')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
});

test('mobile touch can open, focus and close the challenge', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4340',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await page.goto('/ar/');
    await page.locator('[data-challenge-open]').tap();
    await expect(page.locator('#challenge-dialog input[type=tel]')).toBeVisible();
    await page.locator('#challenge-dialog input[type=tel]').tap();
    await expect(page.locator('#challenge-dialog input[type=tel]')).toBeFocused();
    await page.locator('[data-challenge-close]').tap();
    await expect(page.locator('#challenge-dialog')).not.toBeVisible();
  } finally {
    await context.close();
  }
});
