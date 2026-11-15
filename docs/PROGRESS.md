# PROGRESS.md

Resume point for a fresh session. Read CLAUDE.md and the contract files first, then this.

## Build steps

| Step | Scope | Status |
| ---- | ----- | ------ |
| 1 | Engine shell | Done |
| 2 | Content and layout, no 3D | Not started |
| 3 | The world (docs/SCENE.md, then build) | Not started |
| 4 | DOM and WebGL as one surface | Not started |
| 5 | Finish: adaptive quality, idle rendering, micro-interactions | Not started |

## Where things are

- `src/config/site.ts`: the surname constant, contact placeholders, `DRAFT_PREVIEW`, site URL.
- `src/engine/Engine.ts`: renderer, loop, Lenis, resize, visibility, context loss, quality.
- `src/engine/boot.ts`: singleton creation and router lifecycle (`astro:page-load`, `astro:before-swap`).
- `src/scripts/world-gate.ts`: capability gate and lazy import of the engine.
- `src/components/WorldHost.astro`: `#world`, persisted across navigation, holds the poster.

## Environment notes

- Astro 7 allows one dev server per project. Use `npx astro dev stop` before starting another. Do not pass `--force`: it replaces the running server.
- Python 3.13 is installed. In a session started before the install, call `%LOCALAPPDATA%\Programs\Python\Python313\python3.exe` by full path.
- `?world=off` on any URL skips WebGL and keeps the poster.
