// Bounded local lab sample. Never targets production or sends OTP/mail.
/* global PerformanceObserver, performance */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const label = process.argv[2],
  origin = process.argv[3];
if (
  !['baseline', 'enabled'].includes(label) ||
  !origin ||
  !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)
)
  throw new Error('Use baseline/enabled and a loopback origin');
const browser = await chromium.launch();
const samples = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    const slowdown = width === 390 ? 4 : 1;
    await session.send('Emulation.setCPUThrottlingRate', { rate: slowdown });
    await page.addInitScript(() => {
      window.challengeLab = { cls: 0, lcp: 0, events: [] };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) window.challengeLab.cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.challengeLab.lcp = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (e.interactionId) window.challengeLab.events.push(e.duration);
      }).observe({ type: 'event', durationThreshold: 16, buffered: true });
    });
    await page.goto(origin + '/ar/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator('img[fetchpriority="high"]')
      .evaluateAll((images) => Promise.all(images.map((img) => img.decode().catch(() => {}))));
    await page.waitForTimeout(1500);
    const before = await page.evaluate(() => ({
      lcpMs: window.challengeLab.lcp,
      cls: window.challengeLab.cls,
      scriptBytes: performance
        .getEntriesByType('resource')
        .filter((r) => r.initiatorType === 'script')
        .reduce((n, r) => n + r.encodedBodySize, 0),
      decodedScriptBytes: performance
        .getEntriesByType('resource')
        .filter((r) => r.initiatorType === 'script')
        .reduce((n, r) => n + r.decodedBodySize, 0),
      scripts: performance
        .getEntriesByType('resource')
        .filter((r) => r.initiatorType === 'script')
        .map((r) => new URL(r.name).pathname),
    }));
    if (label === 'enabled') {
      await page.locator('[data-challenge-open]').click();
      await page.locator('#challenge-dialog input[type=tel]').waitFor({ state: 'visible' });
      await page.waitForTimeout(600);
    }
    const after = await page.evaluate(async () => {
      const frames = [];
      await new Promise((resolve) => {
        let previous = 0;
        function frame(time) {
          if (previous) frames.push(time - previous);
          previous = time;
          if (frames.length < 120) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
      frames.sort((a, b) => a - b);
      return {
        cls: window.challengeLab.cls,
        maxRecordedInteractionMs: Math.max(0, ...window.challengeLab.events),
        frameMedianMs: frames[Math.floor(frames.length / 2)],
        frameP95Ms: frames[Math.floor(frames.length * 0.95)],
        framesOver34ms: frames.filter((t) => t > 34).length,
        scriptBytes: performance
          .getEntriesByType('resource')
          .filter((r) => r.initiatorType === 'script')
          .reduce((n, r) => n + r.encodedBodySize, 0),
        decodedScriptBytes: performance
          .getEntriesByType('resource')
          .filter((r) => r.initiatorType === 'script')
          .reduce((n, r) => n + r.decodedBodySize, 0),
      };
    });
    samples.push({ width, cpuSlowdown: slowdown, before, after });
    await context.close();
  }
} finally {
  await browser.close();
}
const result = {
  label,
  measuredAt: new Date().toISOString(),
  environment:
    'Local Chromium, loopback, no network throttling; one sample per viewport. Baseline proxy compresses, enabled harness does not: compare decodedScriptBytes, not encoded scriptBytes. Not field CWV/INP or a 60 FPS guarantee.',
  samples,
};
await mkdir('docs/evidence/challenge', { recursive: true });
await writeFile(
  `docs/evidence/challenge/performance-${label}.json`,
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result));
