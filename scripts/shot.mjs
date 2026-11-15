#!/usr/bin/env node
// shot: desktop (1440x900) and mobile (390x844) screenshots of a URL into .shots/.
// Usage: node scripts/shot.mjs [url] [--name <prefix>] [--wait <ms>]
// Headless Chromium with SwiftShader so WebGL works on machines without a GPU.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Browsers are installed inside node_modules (see CLAUDE.md). Must be set before playwright loads.
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
const { chromium } = await import('playwright');

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv.splice(i, 2)[1] : fallback;
};
const name = flag('--name', 'page');
const waitMs = Number(flag('--wait', '800'));
const url = argv[0] ?? 'http://localhost:4321/';
const outDir = join(process.cwd(), '.shots');
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  {
    label: 'desktop',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  {
    label: 'mobile',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
];

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
  ],
});

let failed = false;
try {
  for (const v of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: v.viewport,
      deviceScaleFactor: v.deviceScaleFactor,
      isMobile: v.isMobile,
      hasTouch: v.hasTouch,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(msg.text()));
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    if (!response || !response.ok()) {
      console.error(`shot: ${v.label} got HTTP ${response?.status() ?? 'no response'} from ${url}`);
      failed = true;
    }
    await page.waitForTimeout(waitMs);

    const gl = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('webgl2');
      if (!ctx) return { webgl2: false, renderer: null };
      const info = ctx.getExtension('WEBGL_debug_renderer_info');
      return {
        webgl2: true,
        renderer: info
          ? ctx.getParameter(info.UNMASKED_RENDERER_WEBGL)
          : ctx.getParameter(ctx.RENDERER),
      };
    });

    const file = join(outDir, `${name}-${v.label}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`shot: ${v.label} ${v.viewport.width}x${v.viewport.height} -> ${file}`);
    console.log(`      webgl2=${gl.webgl2} renderer=${gl.renderer ?? 'n/a'}`);
    if (consoleErrors.length)
      console.warn(`      console errors:\n        ${consoleErrors.join('\n        ')}`);
    await context.close();
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
