#!/usr/bin/env node
// film: captures a sequence of frames at scroll positions, to review scroll choreography.
// Usage: node scripts/film.mjs <url> --name <prefix> --at 0,700,1400 [--mobile] [--settle <ms>]
//   --at      comma-separated scroll offsets in CSS px, or '@selector' (optionally '@selector|offsetPx').
//   --mobile  390x844 at 2x instead of 1440x900.
// Writes .shots/<prefix>-<index>.png. Headless Chromium with SwiftShader.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
const { chromium } = await import('playwright');

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv.splice(i, 2)[1] : fallback;
};
const name = flag('--name', 'film');
const at = flag('--at', '0').split(',');
const settle = Number(flag('--settle', '1600'));
const mobileIdx = argv.indexOf('--mobile');
const mobile = mobileIdx >= 0;
if (mobile) argv.splice(mobileIdx, 1);
const url = argv[0] ?? 'http://localhost:4321/';
const out = join(process.cwd(), '.shots');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext(
  mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } },
);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.getElementById('world')?.dataset.state === 'live', null, { timeout: 25000 }).catch(() => {});
await page.waitForTimeout(2600);

for (let i = 0; i < at.length; i++) {
  const target = at[i];
  await page.evaluate((t) => {
    if (t.startsWith('@')) {
      const [sel, off] = t.slice(1).split('|');
      const el = document.querySelector(sel ?? '');
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + Number(off ?? 0));
    } else window.scrollTo(0, Number(t));
  }, target);
  await page.waitForTimeout(settle);
  const file = join(out, `${name}-${String(i).padStart(2, '0')}.png`);
  await page.screenshot({ path: file });
  console.log(`film: ${target} -> ${file}`);
}
if (errors.length) console.warn('errors:\n  ' + errors.join('\n  '));
await browser.close();
