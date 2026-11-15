# CLAUDE.md

Personal 3D portfolio for Ahmad, a software engineer. Astro 7 static site, vanilla Three.js engine in plain TypeScript classes, GSAP and Lenis. No UI framework.

## Read before working

- `DESIGN.md`: visual direction, banned patterns, asset budgets, motion and memory rules.
- `ARCHITECTURE.md`: engine shape, render loop, persistent canvas, fallbacks, performance budgets.
- `docs/CONTENT.md`: the only source of facts about Ahmad and his projects. Approval status lives here.
- `docs/SKILLS.md`: which agent skills are installed, their pins, and when to use each one.
- `docs/DECISIONS.md`: dated decision log. Add an entry for every decision that changes a contract file.

## Content rules (hard)

1. No medical, clinical, health, or academic-medical-research content anywhere: code, copy, alt text, metadata, filenames, placeholders. `npm run slop` enforces a word list.
2. Never publish a client name, logo, screenshot, or metric unless it is approved in `docs/CONTENT.md`.
3. Never invent metrics, testimonials, employers, dates, or links. Use a visible `TODO` placeholder instead.
4. No personal identifiers beyond the approved facts. No student ID, phone number, or home address.
5. A project renders publicly only when its entry has `public: true` AND its row in `docs/CONTENT.md` is approved.
6. Copy and docs: no em dashes, no contractions. Run the `unslop-text` skill on any prose before calling it done.

## Engineering rules

- Check every Three.js, GSAP, and Lenis API against the installed package types in `node_modules` (`three`, `@types/three`, `gsap/types`, `lenis/dist`). Never rely on memory for signatures, defaults, or deprecations.
- Ask before adding, removing, or upgrading any dependency. Versions are pinned exact; keep them that way.
- One Engine, one `requestAnimationFrame` loop (driven by `gsap.ticker`), one resize path. See `ARCHITECTURE.md`.
- No allocations (`new THREE.Vector3`, `new THREE.Color`, arrays, closures) inside per-frame code. Reuse scratch objects.
- Every animation is tied to user intent and uses damped interpolation. Respect `prefers-reduced-motion`.
- Dispose geometries, materials, textures, and render targets when a scene part is removed.
- All content must be readable with JavaScript or WebGL disabled.

## Definition of done

- Run `npm run verify` (check, lint, slop, budget, build) and confirm it passes before saying anything is done. Report failures with their output.
- For any visual change, run `npm run shot -- <url>` and look at both screenshots in `.shots/` before claiming it works.
- Never commit secrets, `.env` files, or tokens. The pre-commit hook runs `verify`; do not bypass it with `--no-verify`.

## Skills: local restrictions

- `impeccable` is installed as markdown only. Its engine is not installed. Do not run `scripts/impeccable`, do not download its binary, and do not enable its hooks.
- `design-taste-frontend` (Taste Skill) had its Stop hook removed. Its `photos.mjs`, `icons.mjs`, and `consistency.mjs` make network requests: ask before running them. Its company-site and photography guidance does not override `DESIGN.md`.
- `3dviz-pro-max`: Blender integration is removed and must stay off. Where its workflow conflicts with `DESIGN.md` or `ARCHITECTURE.md`, those files win.
- `ui-ux-pro-max` is not to be installed.

## Commands

- `npm run dev` starts Astro on port 4321.
- `npm run verify` is the full gate. `npm run slop -- --changed` checks only changed files.
- `npm run budget` checks `public/models` and `public/textures`.
- `npm run shot -- http://localhost:4321/` writes desktop and mobile screenshots to `.shots/`.
- Playwright browsers live in `node_modules` (`PLAYWRIGHT_BROWSERS_PATH=0`). Reinstall with `PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium`.
