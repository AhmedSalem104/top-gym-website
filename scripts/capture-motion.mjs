import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const origin = process.argv[2] ?? 'http://127.0.0.1:4323';
const browser = await chromium.launch();
await mkdir('docs/evidence', { recursive: true });
try {
  for (const [locale, width] of [
    ['ar', 390],
    ['en', 1440],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      recordVideo: { dir: '.local/motion-video', size: { width, height: 844 } },
    });
    const page = await context.newPage();
    await page.goto(`${origin}/${locale}/`);
    await page.waitForTimeout(1200);
    const frames = [];
    await page
      .locator('.facility-grid')
      .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    for (const delay of [80, 240, 800]) {
      await page.waitForTimeout(delay);
      frames.push(
        await sharp(await page.screenshot())
          .resize({ width: 480 })
          .png()
          .toBuffer(),
      );
    }
    const frameSize = await sharp(frames[0]).metadata();
    await sharp({
      create: {
        width: 480 * frames.length,
        height: frameSize.height,
        channels: 3,
        background: '#0b0d0f',
      },
    })
      .composite(frames.map((input, index) => ({ input, left: index * 480, top: 0 })))
      .webp({ quality: 88 })
      .toFile(`docs/evidence/motion-${locale}-sequence.webp`);
    for (const id of ['credentials', 'gallery', 'memberships', 'schedule', 'location', 'contact']) {
      await page
        .locator(`#${id}`)
        .evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'smooth' }));
      await page.waitForTimeout(1200);
    }
    await page
      .locator('.footer-bottom')
      .evaluate((el) => el.scrollIntoView({ behavior: 'smooth' }));
    await page.waitForTimeout(1000);
    await page.locator('[data-lightbox="certificates"]').first().click();
    await page.waitForTimeout(700);
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(1300);
    if (width === 390) {
      await page.locator('.menu-toggle').click();
      await page.waitForTimeout(700);
      await sharp(await page.screenshot())
        .webp({ quality: 88 })
        .toFile('docs/evidence/motion-ar-mobile-menu.webp');
      await page.keyboard.press('Escape');
    }
    const video = page.video();
    await context.close();
    await video.saveAs(`docs/evidence/motion-${locale}-${width}.webm`);
    console.log(`Recorded ${locale} ${width}px motion review.`);
  }
} finally {
  await browser.close();
}
