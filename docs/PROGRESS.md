# PROGRESS.md

Resume point for a fresh session. Read CLAUDE.md and the contract files first, then this.

## Build steps

| Step | Scope | Status |
| ---- | ----- | ------ |
| 1 | Engine shell | Done |
| 2 | Content and layout, no 3D | Done |
| 3 | The world: Glass Deck (Showcase, Covers) | Done |
| 4 | DOM and WebGL as one surface: scroll choreography, stacking cards, page transitions | Done |
| 5 | Finish: adaptive quality, idle rendering, micro-interactions | Not started |

## Direction

Glass Deck (DESIGN.md section 1, docs/SCENE.md). Ahmad rejected both the seven-stage Request Path and the Kinetic Field pin field. Do not bring either back.

## Where things are

- `src/config/site.ts`: the surname constant, contact placeholders, `DRAFT_PREVIEW`, site URL.
- `src/engine/Engine.ts`: renderer, loop, Lenis, resize, visibility, context loss, quality.
- `src/engine/boot.ts`: singleton creation and router lifecycle (`astro:page-load`, `astro:before-swap`).
- `src/scripts/world-gate.ts`: capability gate and lazy import of the engine.
- `src/components/WorldHost.astro`: `#world`, persisted across navigation, holds the poster.
- `src/motion/core.ts`: Lenis, the one ticker, ScrollTrigger, router lifecycle. `src/motion/scenes.ts`: page choreography. `src/motion/state.ts`: shared progress values.
- `src/engine/world/Showcase.ts`: the glossy deck and its poses. `cardArt.ts`: card faces rendered once.
- `src/engine/world/Covers.ts`: WebGL plates mapped onto `[data-plate]` figures, tracked plates, stack cut line.
- `scripts/film.mjs`: frames at scroll positions for reviewing choreography.
- `src/lib/patterns.ts` and `src/engine/shaders/patterns.ts`: the relief patterns, TypeScript and GLSL twins.
- `src/lib/projects.ts`: visibility (draft switch plus CONTENT.md approval), pattern ids.
- `scripts/prelaunch.mjs`: launch gate. `scripts/font-fallback.mjs`: fallback metrics.

## Remaining work

- Step 5: Open Graph image (`/og.png` referenced, not generated), measured frame rate, Lighthouse runs, idle-render check, final micro-interaction pass.
