import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const url = process.argv[2] ?? 'http://127.0.0.1:4321';
const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--disable-gpu'],
});
const summary = [];
try {
  await mkdir('.local/lighthouse', { recursive: true });
  await mkdir('docs/evidence', { recursive: true });
  for (const locale of ['ar', 'en']) {
    for (const mode of ['mobile', 'desktop']) {
      const result = await lighthouse(
        `${url}/${locale}/`,
        {
          port: chrome.port,
          output: 'json',
          logLevel: 'error',
        },
        mode === 'desktop' ? desktopConfig : undefined,
      );
      const lhr = result.lhr;
      await writeFile(`.local/lighthouse/${locale}-${mode}.json`, JSON.stringify(lhr));
      const record = {
        locale,
        mode,
        measuredAt: lhr.fetchTime,
        lighthouseVersion: lhr.lighthouseVersion,
        formFactor: lhr.configSettings.formFactor,
        viewport: lhr.configSettings.screenEmulation,
        url: lhr.finalDisplayedUrl,
        scores: Object.fromEntries(
          Object.entries(lhr.categories).map(([key, value]) => [
            key,
            Math.round(value.score * 100),
          ]),
        ),
        metrics: {
          fcp: lhr.audits['first-contentful-paint'].displayValue,
          lcp: lhr.audits['largest-contentful-paint'].displayValue,
          cls: lhr.audits['cumulative-layout-shift'].displayValue,
          tbt: lhr.audits['total-blocking-time'].displayValue,
        },
        notes:
          'Local Chromium lab measurement; review build intentionally noindex. Not field data or a production-domain test.',
      };
      summary.push(record);
      console.log(record);
    }
  }
  await writeFile('docs/evidence/lighthouse-summary.json', JSON.stringify(summary, null, 2) + '\n');
} finally {
  chrome.kill();
}
