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

Glass Deck, dark, with the liquid splash (DESIGN.md section 1, docs/SCENE.md). Rejected by Ahmad, do not bring back: the seven-stage Request Path, the Kinetic Field pin field, the light theme, sticky stacking cards, a row of cards, zooming the whole hero out into a frame.

## Where things are

- `src/config/site.ts`: the surname constant, contact placeholders, `DRAFT_PREVIEW`, site URL.
- `src/engine/Engine.ts`: renderer, loop, Lenis, resize, visibility, context loss, quality.
- `src/engine/boot.ts`: singleton creation and router lifecycle (`astro:page-load`, `astro:before-swap`).
- `src/scripts/world-gate.ts`: capability gate and lazy import of the engine.
- `src/components/WorldHost.astro`: `#world`, persisted across navigation, holds the poster.
- `src/motion/core.ts`: Lenis, the one ticker, ScrollTrigger, router lifecycle. `src/motion/scenes.ts`: page choreography. `src/motion/state.ts`: shared progress values.
- `src/motion/liquid.ts`: the cursor splash (own canvas, raw WebGL2). `src/components/WorkGallery.astro`: the pinned wheel gallery markup.
- `src/engine/world/Showcase.ts`: the glossy deck, its poses, and the floating layer planes. `cardArt.ts`: card art in three layers (multiple render targets).
- `src/engine/shaders/holo.ts`: the drawing kit for layered motion graphics. `src/engine/shaders/scenes.ts`: the fourteen project scenes. `src/lib/palettes.ts`: palette and scene number per project. `src/engine/world/palette.ts`: palette uniforms.
- `src/engine/shaders/shots.ts`: the motion graphic over real screenshots. `src/engine/world/shotAtlas.ts`: shared atlas textures. `scripts/project-shots.mjs`: crops, blurs, and exports the Drive screenshots to `public/projects` and `src/data/shots.json`.
- `src/engine/world/Covers.ts`: WebGL plates mapped onto `[data-plate]` figures; they play the project scene with pointer parallax.
- `scripts/film.mjs`: frames at scroll positions for reviewing choreography.
- `src/lib/patterns.ts` and `src/engine/shaders/patterns.ts`: the relief patterns, TypeScript and GLSL twins.
- `src/lib/projects.ts`: visibility (draft switch plus CONTENT.md approval), pattern ids.
- `scripts/prelaunch.mjs`: launch gate. `scripts/font-fallback.mjs`: fallback metrics.

## Remaining work

- Content: projects now come from the Notion knowledge base and the Drive OnePercent folder (2026-11-19). Roles on Vakse, Codesmash, and MenuMatch, and most fields on the Drive-only projects, are TODO. See `docs/CONTENT.md`.

- Step 5: Open Graph image (`/og.png` referenced, not generated), measured frame rate, Lighthouse runs, idle-render check, final micro-interaction pass.
