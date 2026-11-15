#!/usr/bin/env node
// slop-check: fails (exit 1) when src/ contains banned design patterns or banned content.
// Usage: node scripts/slop-check.mjs [--changed]
//   --changed  only scan files under src/ that differ from HEAD or are untracked.
// A line may opt out of a design rule (never the content rule) with a trailing
// comment containing `slop-allow: <reason>`.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src'];
const CONTENT_ONLY_DIRS = ['public'];
const TEXT_EXT = new Set([
  '.astro',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.css',
  '.scss',
  '.md',
  '.mdx',
  '.json',
  '.html',
  '.svg',
  '.txt',
  '.yml',
  '.yaml',
]);
const SKIP_DIRS = new Set(['node_modules', '.astro', 'dist', '.git']);

// ---------- rules ----------

const PRIMARY_FONT = /\b(Inter|Roboto|Arial|system-ui)\b/i;
const PURPLE_HEX = [
  // Tailwind purple, violet, indigo, fuchsia 300-900, plus common AI-purple picks.
  'a5b4fc',
  '818cf8',
  '6366f1',
  '4f46e5',
  '4338ca',
  '3730a3',
  '312e81',
  'c4b5fd',
  'a78bfa',
  '8b5cf6',
  '7c3aed',
  '6d28d9',
  '5b21b6',
  '4c1d95',
  'd8b4fe',
  'c084fc',
  'a855f7',
  '9333ea',
  '7e22ce',
  '6b21a8',
  '581c87',
  'f0abfc',
  'e879f9',
  'd946ef',
  'c026d3',
  'a21caf',
  '8a2be2',
  '9400d3',
  '663399',
  '9370db',
  '4b0082',
  'ee82ee',
];

/** @type {Array<{id:string, level:'error'|'warn', allowable:boolean, test:(line:string)=>boolean, message:string}>} */
const LINE_RULES = [
  {
    id: 'banned-primary-font',
    level: 'error',
    allowable: true,
    message: 'Inter, Roboto, Arial, or system-ui used as the primary font.',
    test: (line) => {
      // CSS font-family / font shorthand / custom property / JS fontFamily: inspect the FIRST family.
      const m =
        line.match(/font-family\s*:\s*([^;}"'`]*["']?[^;}]*)/i) ||
        line.match(/--font[\w-]*\s*:\s*([^;}]*)/i) ||
        line.match(/fontFamily\s*[:=]\s*\[?\s*([^\]\n]*)/);
      if (m) {
        const first = m[1].split(',')[0].replace(/["'`\s[\]]/g, '');
        if (PRIMARY_FONT.test(first) && /^(inter|roboto|arial|system-ui)$/i.test(first))
          return true;
      }
      return /@fontsource(-variable)?\/(inter|roboto)\b|fonts\.googleapis\.com\/css2?\?family=(Inter|Roboto)\b/i.test(
        line,
      );
    },
  },
  {
    id: 'purple-gradient-or-primary',
    level: 'error',
    allowable: true,
    message: 'Purple, indigo, or violet gradient class or color value.',
    test: (line) =>
      /\b(from|via|to|bg|text|border|ring|fill|stroke|shadow|outline|decoration|accent|caret)-(purple|indigo|violet|fuchsia)-(\d{2,3}|\[)/i.test(
        line,
      ) ||
      new RegExp(`#(${PURPLE_HEX.join('|')})\\b`, 'i').test(line) ||
      /0x(6366f1|7c3aed|8b5cf6|a855f7|4f46e5|9333ea)\b/i.test(line) ||
      /(gradient|color|background|fill|stroke|accent)[^;\n]*\b(indigo|violet|purple|blueviolet|darkviolet|mediumpurple|rebeccapurple)\b/i.test(
        line,
      ),
  },
  {
    id: 'backdrop-blur',
    level: 'error',
    allowable: true,
    message: 'backdrop-blur or backdrop-filter blur (unprompted glassmorphism).',
    test: (line) => /backdrop-blur|backdrop-filter\s*:[^;]*blur/i.test(line),
  },
  {
    id: 'rounded-xl-shadow-lg',
    level: 'error',
    allowable: true,
    message: 'rounded-xl combined with shadow-lg (generic AI card).',
    test: (line) => /\brounded-xl\b/.test(line) && /\bshadow-lg\b/.test(line),
  },
  {
    id: 'sparkle-glyph',
    level: 'error',
    allowable: true,
    message: 'Sparkle glyph used as decoration.',
    test: (line) => /[✦✧✨❇✶-✽]|&#x?(10022|2726|10024|2728);/i.test(line),
  },
  {
    id: 'decorative-primitive',
    level: 'error',
    allowable: true,
    message:
      'TorusKnotGeometry or IcosahedronGeometry. Decorative primitives are banned; add `slop-allow: <reason>` only for a real, non-decorative use.',
    test: (line) => /\b(TorusKnotGeometry|IcosahedronGeometry)\b/.test(line),
  },
];

const MEDICAL_WORDS =
  /\b(mbbs|medical(ly)?|clinical(ly)?|clinics?|patients?|pathology|pharmacology|cancers?|hospitals?|physicians?|diagnos(is|es|e|ed|tic))\b/i;

// ---------- file discovery ----------

function walk(dir, out) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function changedFiles() {
  try {
    const git = (args) =>
      execFileSync('git', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .split('\n')
        .filter(Boolean);
    let tracked = [];
    try {
      tracked = git(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']);
    } catch {
      tracked = git(['diff', '--name-only', '--diff-filter=ACMR', '--cached']);
    }
    const untracked = git(['ls-files', '--others', '--exclude-standard']);
    return [...new Set([...tracked, ...untracked])]
      .map((f) => join(ROOT, f))
      .filter((f) => existsSync(f));
  } catch {
    return null;
  }
}

const inDir = (file, dirs) =>
  dirs.some((d) => relative(join(ROOT, d), file).split(sep)[0] !== '..');

// ---------- per-frame allocation heuristic ----------

const FRAME_START =
  /(gsap\.ticker\.add|requestAnimationFrame|setAnimationLoop|onBeforeRender|onAfterRender)\s*\(|\b(update|tick|render|animate|onFrame|frame|loop|step)\s*\([^)]*\)\s*(:\s*[\w<>[\]|\s]+)?\s*\{/;
const FRAME_ALLOC =
  /new\s+(THREE\.)?(Vector2|Vector3|Vector4|Color|Quaternion|Euler|Matrix3|Matrix4|Box3|Sphere|Ray|Plane)\s*\(/;

function frameAllocWarnings(lines) {
  const hits = [];
  let depth = 0;
  let inFrame = false;
  let frameDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inFrame && FRAME_START.test(line)) {
      inFrame = true;
      frameDepth = depth;
    }
    if (inFrame && FRAME_ALLOC.test(line) && !/slop-allow:/.test(line)) hits.push(i);
    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    if (inFrame && depth <= frameDepth && /\}/.test(line)) inFrame = false;
  }
  return hits;
}

// ---------- main ----------

const args = new Set(process.argv.slice(2));
const onlyChanged = args.has('--changed');

let files;
if (onlyChanged) {
  const changed = changedFiles();
  files =
    changed === null ? null : changed.filter((f) => inDir(f, [...SCAN_DIRS, ...CONTENT_ONLY_DIRS]));
}
if (!files) files = [...SCAN_DIRS, ...CONTENT_ONLY_DIRS].flatMap((d) => walk(join(ROOT, d), []));

const errors = [];
const warnings = [];
const report = (list, file, line, id, message, snippet) =>
  list.push(
    `${relative(ROOT, file)}${line ? `:${line}` : ''}  [${id}] ${message}${snippet ? `\n      ${snippet.trim().slice(0, 140)}` : ''}`,
  );

for (const file of files) {
  const rel = relative(ROOT, file);
  if (MEDICAL_WORDS.test(rel))
    report(errors, file, 0, 'medical-content', 'Banned word in file path.', rel);
  const contentOnly = inDir(file, CONTENT_ONLY_DIRS);
  if (!TEXT_EXT.has(extname(file).toLowerCase())) continue;
  if (statSync(file).size > 2_000_000) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    if (MEDICAL_WORDS.test(line))
      report(errors, file, idx + 1, 'medical-content', 'Banned medical word.', line);
    if (contentOnly) return;
    const allowed = /slop-allow:\s*\S/.test(line);
    for (const rule of LINE_RULES) {
      if (rule.allowable && allowed) continue;
      if (rule.test(line))
        report(
          rule.level === 'error' ? errors : warnings,
          file,
          idx + 1,
          rule.id,
          rule.message,
          line,
        );
    }
  });
  if (!contentOnly && /\.(ts|tsx|js|mjs|astro)$/.test(file)) {
    for (const i of frameAllocWarnings(lines)) {
      report(
        warnings,
        file,
        i + 1,
        'per-frame-allocation',
        'Possible allocation inside a per-frame function (heuristic). Reuse a scratch object.',
        lines[i],
      );
    }
  }
}

const scope = onlyChanged ? 'changed files' : 'src/ and public/';
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
if (errors.length) {
  console.error(
    `\nslop-check: ${errors.length} error(s), ${warnings.length} warning(s) in ${files.length} file(s) (${scope}).`,
  );
  process.exit(1);
}
console.log(
  `slop-check: clean. ${warnings.length} warning(s) in ${files.length} file(s) (${scope}).`,
);
