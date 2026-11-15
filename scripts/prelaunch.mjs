#!/usr/bin/env node
// prelaunch: the launch gate. Fails (exit 1) while any dummy or unconfirmed content remains.
// Not part of `npm run verify`, so normal builds stay green while drafting.
//
// Checks:
//   1. `placeholder: true` anywhere in src/ (content entries and config).
//   2. The surname placeholder "[Surname]".
//   3. DRAFT_PREVIEW = true in src/config/site.ts.
//   4. Placeholder link targets: url: '#' or href: '#'.
//   5. Unconfirmed facts in docs/CONTENT.md (Status column not "Confirmed").
//   6. Visible TODO markers in pages and components (<Todo ...>).

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = process.cwd();
const TEXT = new Set(['.ts', '.astro', '.md', '.mdx', '.mjs', '.js', '.json', '.css']);
const findings = [];
const add = (kind, file, line, text) => findings.push({ kind, where: `${relative(ROOT, file)}${line ? `:${line}` : ''}`, text: text.trim().slice(0, 120) });

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (TEXT.has(extname(e.name))) out.push(full);
  }
  return out;
}

for (const file of walk(join(ROOT, 'src'))) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const isContent = file.includes(`${join('src', 'content')}`);
  lines.forEach((line, i) => {
    const n = i + 1;
    if (/placeholder:\s*true/.test(line)) {
      // In YAML the fact name is on a line above; report it for a readable list.
      let field = '';
      for (let j = i - 1; j >= 0 && j >= i - 4; j--) {
        const m = lines[j].match(/^(\s{0,4})([a-zA-Z]+):\s*$/) || lines[j].match(/^\s*-?\s*label:\s*'?([^']+)'?/);
        if (m) {
          field = m[2] ?? m[1];
          break;
        }
      }
      add('placeholder', file, n, isContent ? `${field || 'field'} is a placeholder` : line);
    }
    if (line.includes('[Surname]')) add('surname', file, n, line);
    if (/DRAFT_PREVIEW\s*=\s*true/.test(line)) add('draft-preview', file, n, line);
    if (/(url|href):\s*'#'/.test(line)) add('placeholder-link', file, n, line);
    if (/<Todo\b/.test(line)) add('todo-marker', file, n, line);
  });
}

const content = join(ROOT, 'docs', 'CONTENT.md');
if (existsSync(content)) {
  const text = readFileSync(content, 'utf8');
  const facts = text.split('## Approved facts')[1]?.split('\n## ')[0] ?? '';
  for (const line of facts.split('\n')) {
    if (!line.startsWith('|') || /^\|\s*-/.test(line) || /\|\s*Fact\s*\|/.test(line)) continue;
    const cells = line.split('|').map((c) => c.trim());
    if (cells[3] && !/^confirmed/i.test(cells[3])) add('unconfirmed-fact', content, 0, `${cells[1]}: ${cells[3]}`);
  }
}

if (!findings.length) {
  console.log('prelaunch: clean. No placeholders, draft switches, or unconfirmed facts remain.');
  process.exit(0);
}

const groups = new Map();
for (const f of findings) {
  if (!groups.has(f.kind)) groups.set(f.kind, []);
  groups.get(f.kind).push(f);
}
const titles = {
  surname: 'Surname placeholder',
  'draft-preview': 'Draft preview switch',
  placeholder: 'Fields marked placeholder: true',
  'placeholder-link': "Links that point to '#'",
  'todo-marker': 'Visible TODO markers in templates',
  'unconfirmed-fact': 'Facts in docs/CONTENT.md not yet confirmed',
};
for (const [kind, list] of groups) {
  console.error(`\n${titles[kind] ?? kind} (${list.length})`);
  for (const f of list) console.error(`  ${f.where}  ${f.text}`);
}
console.error(`\nprelaunch: ${findings.length} item(s) must be resolved before launch.`);
process.exit(1);
