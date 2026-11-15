#!/usr/bin/env node
// font-fallback: measures size-adjust for the metric-matched fallback faces in src/styles/fonts.css.
// Renders a sample paragraph in each web font and in its local fallback at the same size in
// Chromium, then prints the width ratio as a percentage. Usage: node scripts/font-fallback.mjs

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
const { chromium } = await import('playwright');

const root = process.cwd();
const font = (pkg, file) =>
  readFileSync(join(root, 'node_modules', '@fontsource', pkg, 'files', file)).toString('base64');

const faces = [
  { family: 'Familjen Grotesk', data: font('familjen-grotesk', 'familjen-grotesk-latin-700-normal.woff2'), weight: 700, local: 'Arial' },
  { family: 'Public Sans', data: font('public-sans', 'public-sans-latin-400-normal.woff2'), weight: 400, local: 'Arial' },
  { family: 'Commit Mono', data: font('commit-mono', 'commit-mono-latin-400-normal.woff2'), weight: 400, local: 'Courier New' },
];

const sample =
  'I ship AI systems into production for paying clients. Co-founder of OnePercent Technologies, an AI and software agency serving clients in the US, UK, and Middle East.';

const browser = await chromium.launch();
const page = await browser.newPage();
const css = faces
  .map((f) => `@font-face{font-family:'${f.family}';src:url(data:font/woff2;base64,${f.data}) format('woff2');font-weight:${f.weight};}`)
  .join('\n');
await page.setContent(`<style>${css}</style><body></body>`);
const results = await page.evaluate(
  async ({ faces, sample }) => {
    const out = [];
    for (const f of faces) {
      await document.fonts.load(`${f.weight} 32px '${f.family}'`);
      const measure = (family) => {
        const s = document.createElement('span');
        s.style.cssText = `font:${f.weight} 32px ${family};white-space:nowrap;position:absolute`;
        s.textContent = sample;
        document.body.appendChild(s);
        const w = s.getBoundingClientRect().width;
        s.remove();
        return w;
      };
      out.push({ family: f.family, local: f.local, ratio: measure(`'${f.family}'`) / measure(`'${f.local}'`) });
    }
    return out;
  },
  { faces: faces.map(({ family, weight, local }) => ({ family, weight, local })), sample },
);
await browser.close();
for (const r of results) console.log(`${r.family} vs ${r.local}: size-adjust ${(r.ratio * 100).toFixed(2)}%`);
