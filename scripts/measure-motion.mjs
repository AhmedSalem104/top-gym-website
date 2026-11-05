import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.argv[2] ?? 'http://127.0.0.1:4323';
const browser = await chromium.launch();
const results = [];
try {
  for (const locale of ['ar', 'en']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: 1_600_000 / 8,
      uploadThroughput: 750_000 / 8,
    });
    await page.addInitScript(() => {
      window.motionLab = { cls: 0, longTasks: [], lcp: 0 };
      new window.PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) window.motionLab.cls += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
      new window.PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          window.motionLab.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }).observe({ type: 'longtask', buffered: true });
      new window.PerformanceObserver((list) => {
        window.motionLab.lcp = list.getEntries().at(-1).startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    await page.goto(`${origin}/${locale}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const scroll = await page.evaluate(async () => {
      const start = window.performance.now();
      const samples = [];
      // This bounded rAF loop is QA instrumentation only, never shipped to visitors.
      const traverse = (step, upwards = false) =>
        new Promise((resolve) => {
          let previous;
          let position = upwards ? document.documentElement.scrollHeight - window.innerHeight : 0;
          const limit = document.documentElement.scrollHeight - window.innerHeight;
          const frame = (time) => {
            if (previous !== undefined) samples.push(time - previous);
            previous = time;
            position += upwards ? -step : step;
            window.scrollTo({ top: Math.max(0, Math.min(position, limit)), behavior: 'instant' });
            if (upwards ? position <= 0 : position >= limit) resolve();
            else requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
      await traverse(32);
      await traverse(300, true);
      await traverse(220);
      await new Promise((resolve) => window.setTimeout(resolve, 1100));
      const sorted = [...samples].sort((a, b) => a - b);
      const round = (value) => Math.round(value * 100) / 100;
      return {
        samples: samples.length,
        durationMs: round(window.performance.now() - start),
        medianFrameIntervalMs: round(sorted[Math.floor(sorted.length * 0.5)]),
        p95FrameIntervalMs: round(sorted[Math.floor(sorted.length * 0.95)]),
        intervalsOver34Ms: samples.filter((value) => value > 34).length,
        longTasksDuringScroll: window.motionLab.longTasks.filter((task) => task.start >= start),
        cls: window.motionLab.cls,
        lcpMs: round(window.motionLab.lcp),
        unseen: [...document.querySelectorAll('[data-motion-state="pending"]')].map((el) =>
          el.outerHTML.slice(0, 100),
        ),
        runningAnimationsAfterSettling: document
          .getAnimations()
          .filter((animation) => animation.playState === 'running').length,
        brokenImages: [...document.querySelectorAll('main img')]
          .filter((img) => !img.complete || !img.naturalWidth)
          .map((img) => img.src),
      };
    });
    results.push({
      locale,
      measuredAt: new Date().toISOString(),
      browser: browser.version(),
      viewport: '390x844 DPR1',
      cpuSlowdown: 6,
      network: '1.6 Mbps down / 750 Kbps up / 150 ms latency',
      ...scroll,
      consoleErrors: errors,
    });
    console.log(results.at(-1));
    await context.close();
  }
  await mkdir('docs/evidence', { recursive: true });
  await writeFile(
    'docs/evidence/motion-performance.json',
    JSON.stringify(
      {
        method:
          'Headless Chromium local lab. Bounded scripted slow/fast/down/up scrolling. rAF cadence is not a GPU frame-time measurement or a real-device FPS guarantee. CPU/network emulation is relative to this host.',
        results,
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  await browser.close();
}
