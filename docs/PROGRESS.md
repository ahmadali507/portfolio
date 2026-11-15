# PROGRESS.md

Resume point for a fresh session. Read CLAUDE.md and the contract files first, then this.

## Build steps

| Step | Scope | Status |
| ---- | ----- | ------ |
| 1 | Engine shell | Done |
| 2 | Content and layout, no 3D | Done |
| 3 | The world: Kinetic Field (docs/SCENE.md, Field, Covers) | Done, tuning continues in step 5 |
| 4 | DOM and WebGL as one surface | Not started |
| 5 | Finish: adaptive quality, idle rendering, micro-interactions | Not started |

## Direction

Kinetic Field (DESIGN.md section 1). The seven-stage Request Path concept was rejected by Ahmad and removed. Do not bring it back.

## Where things are

- `src/config/site.ts`: the surname constant, contact placeholders, `DRAFT_PREVIEW`, site URL.
- `src/engine/Engine.ts`: renderer, loop, Lenis, resize, visibility, context loss, quality.
- `src/engine/boot.ts`: singleton creation and router lifecycle (`astro:page-load`, `astro:before-swap`).
- `src/scripts/world-gate.ts`: capability gate and lazy import of the engine.
- `src/components/WorldHost.astro`: `#world`, persisted across navigation, holds the poster.
- `src/engine/world/Field.ts`: the pin field, ripples, pointer lift, camera rig, page morphs, text zones.
- `src/engine/world/Covers.ts`: WebGL cover planes mapped onto `[data-plate]` figures.
- `src/lib/patterns.ts` and `src/engine/shaders/patterns.ts`: the relief patterns, TypeScript and GLSL twins.
- `src/lib/projects.ts`: visibility (draft switch plus CONTENT.md approval), pattern ids.
- `scripts/prelaunch.mjs`: launch gate. `scripts/font-fallback.mjs`: fallback metrics.

## Remaining work

- Step 4: verify page-transition morphs across client-side navigation; keyboard focus on covers mirrors hover.
- Step 5: raster poster and Open Graph image (`/og.png` is referenced but not generated yet), measured frame rate, draw calls and triangles, Lighthouse runs, idle-render check, micro-interaction pass.

## Environment notes

- Astro 7 allows one dev server per project. Use `npx astro dev stop` before starting another. Do not pass `--force`: it replaces the running server.
- Python 3.13 is installed. In a session started before the install, call `%LOCALAPPDATA%\Programs\Python\Python313\python3.exe` by full path.
- `?world=off` on any URL skips WebGL and keeps the poster.
