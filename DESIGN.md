# DESIGN.md: Anti-Slop and 3D Engineering Contract

This file binds every human and agent working on the site. If a skill, a tutorial, or a prompt disagrees with this file, this file wins. Changes require an entry in `docs/DECISIONS.md`.

## 1. Aesthetic direction

Direction: **Glass Deck, dark.** Set by Ahmad's instructions on 2026-11-15 and 2026-11-16. Request Path and Kinetic Field are retired. See `docs/DECISIONS.md`.

- **Visual persona:** dark, clean, glossy, and minimal. Giant grotesk type on a near-black ground and a single hero object finished like lacquer and porcelain. Every motion is staged as a beat: entrance, hold, exit.
- **The home hero is about Ahmad:** his name in heavy capitals on the left, one typed line under it (an adverb in the accent, then the role), one sentence, and two actions. On the right, one 3D object at a time floats on a grid of cells and swaps when the typed role changes. The name holds still: no fill effect, no floating letters. On tall screens the object sits above the name (Ahmad, 2026-11-23).
- **The project object:** a deck of glossy cards, one per featured project. Each card face is a live motion graphic over the project's real, edited screenshots, with the project's name on it. The cards rise from below the fold into the work gallery as it scrolls in, and each comes to the front, large, in turn.
- **Chemistry in the name:** the letters of the main heading fill with a sequence of twelve procedural phenomena (foam, reaction-diffusion stripes, ink in water, crystallisation, boiling, oxidation, acid etch, ferrofluid, smoke, dividing cells, mercury, frost). Each grows through the word as a reaction front and replaces the last. The text stays real and readable.
- **Home page order:** hero, a moving band of the five capabilities, What I build (five cards that stack on top of each other as the page scrolls), Experience (three chapters down a vertical line that fills slowly), projects, Reviews (cards floating on an arc), and the closing call to action (Ahmad, 2026-11-23). Copy stays short: no block on the home page runs past two lines.
- **Case study order:** hook, cover, facts, the part to remember (the only filled panel on the page), the problem, screens, engineering strengths, how it works, what the user gets, outcome, what it proves, links.
- **Continuity:** the canvas persists across navigation. On a case study, that project's card takes the banner; on the work index the deck fans beside the heading. Moving between pages, the cards fly to their new poses.
- **Liquid splash:** the pointer leaves a fluid trail that inverts everything beneath it: type, cards, and header flip to the light theme inside the splash and flow back to dark as it drains. A tap makes one splash on touch screens.
- **Work chapter:** a pinned gallery. Cards come into view one at a time: each rises from below, rests facing the viewer while its title, summary, and a giant index numeral show beside it, then leaves upward. No stacking cards, no row.
- **What the world must never become:** a particle cloud, a neon wireframe, glowing outlines, or abstract decoration that says nothing about the work. Card graphics and the heading phenomena play on their own while on screen; everything else moves only with scroll, pointer, or navigation. All of it holds still under reduced motion.
- **Honesty rule:** card graphics are diagrams of what a kind of product does. They are not screenshots, and they never show a metric or imply a result.

### Banned UI patterns (immediate reject)

- No `Inter`, `Roboto`, `Arial`, or `system-ui` as a primary font.
- The accent is cobalt `#4C6FFF`, chosen by Ahmad on 2026-11-23 from four candidates. It is a flat color, used sparingly. Still banned: purple, indigo, or violet gradients and other primaries (`from-purple-500`, `to-indigo-600`, `#6366f1`, `#7c3aed`, and similar).
- No generic three-column symmetrical feature or project cards with `rounded-xl` plus `shadow-lg`. Full-width stacking cards are the only card pattern.
- No glowing neon borders. No glassmorphism (`backdrop-blur`) on cards. Gloss comes from real reflections in WebGL and one-pixel highlights in CSS, never from blur.
- No decorative floating 3D primitives. No aimlessly spinning torus knots, icosahedrons, or wireframe spheres. The only 3D object is the project deck.
- No pill badges with sparkle glyphs or emoji above section headings. No emoji used as icons.
- No gradient-filled heading text.
- No centered hero with two pill buttons as the opening composition. The home hero is centered at Ahmad's request; it keeps one pill button beside a text link.
- The typed line types, holds, marks the role like an editor selection, and clears. The caret and the adverb are its only accents. It pauses off screen and under reduced motion shows the first role as plain text.
- No cream background plus serif display plus sage accent as an unexamined default. The replacement for one default must not be another default.
- No stock illustration or stock photography standing in for real work.

### Content ban

- No medical, clinical, health, or academic-medical-research content anywhere: copy, code, alt text, metadata, filenames, placeholders. The site presents Ahmad only as a software engineer. `scripts/slop-check.mjs` enforces a word list on `src/`.

## 2. Typography and color tokens

### Type

| Role                                     | Family           | License     | Settings                                                                                                     |
| ---------------------------------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| Display                                  | Syne             | SIL OFL 1.1 | Weight 700 to 800, tracking `-0.03em`. Section titles are two lines of capitals, the first one dimmed            |
| Body                                     | Public Sans      | SIL OFL 1.1 | Weight 400 and 700, line-height `1.55`, base `1rem` to `1.125rem`, measure 60 to 72 characters                   |
| Labels and metadata                      | Public Sans      | SIL OFL 1.1 | Uppercase at `0.75rem` with tracking `+0.12em`. The `--font-mono` token now points at the same sans            |

- Licenses must be confirmed against the LICENSE file shipped with each download before the fonts are committed. Font files are not installed yet.
- Subset to Latin plus the punctuation in use. Preload only the display weight used above the fold. `font-display: swap` with metric-matched fallbacks to limit layout shift.

### Color tokens

| Token                | Value     | Use                                                       | Contrast                        |
| -------------------- | --------- | --------------------------------------------------------- | ------------------------------- |
| `--color-bg`         | `#000000` | Page ground                                               | Base                            |
| `--color-surface`    | `#0C0C0C` | Raised panels and cards                                   | 1.1:1 against bg                |
| `--color-ink`        | `#FFFFFF` | Primary text                                              | 21:1 on bg                      |
| `--color-ink-muted`  | `#A6A6A6` | Secondary text, captions                                  | 8.6:1 on bg                     |
| `--color-rule`       | `#232323` | Hairlines only, never text                                | decorative                      |
| `--color-trace`      | `#4C6FFF` | The accent, cobalt: marks, the caret, lines, the main call to action | 4.9:1 on bg          |
| `--color-trace-ink`  | `#7D95FF` | Small accent text                                         | 7.8:1 on bg                     |
| `--color-trace-deep` | `#2F4FD6` | Fills under `--color-ink` text (the typed selection)      | 6.3:1 with ink                  |

- The trace accent covers under 5 percent of any viewport. It marks the one thing that is live right now and nothing else.
- No gradients on UI surfaces. Depth comes from real reflections in the 3D scene and restrained shadows under the stacking cards.
- The site is dark only. A light variant would need its own contrast table and a decision log entry. Inside the liquid splash the page is inverted by blending; that is decoration, and all content stays readable outside it.

### Rules

- Fonts are self-hosted (`woff2`, subset) with a license that permits web embedding. Record the license in `docs/DECISIONS.md`.
- Tokens live as CSS custom properties in `src/styles/`. Components use tokens, never raw hex values.

## 3. Accessibility (non-negotiable)

- **Reduced motion:** when `prefers-reduced-motion: reduce` is set, disable smooth scroll inertia, camera flights, parallax, and autoplaying shader motion. Replace them with instant state changes or short opacity fades. The 3D world may render a single static frame.
- **Keyboard:** every interactive element, including anything reachable inside the 3D world, has a DOM equivalent that is focusable in a logical order, has a visible focus style, and works with Enter and Space. No keyboard traps. Provide a skip link to main content.
- **Contrast:** all text meets WCAG 2.2 AA (4.5:1 body, 3:1 for large text and UI components) against its actual rendered background, including text drawn over the canvas.
- **Semantics:** one `h1` per page, real landmarks, real links. The canvas is `aria-hidden="true"`; meaning lives in the DOM.
- **Media:** every meaningful image has alt text written by a human. Decorative images use empty alt.

## 4. 3D and WebGL engineering rules

- **Stack:** Three.js (pinned in `package.json`), vanilla TypeScript classes, GSAP, Lenis. No React Three Fiber unless `ARCHITECTURE.md` is changed first.
- **Asset budget:**
  - Total scene triangle count stays under **150,000**.
  - Draw calls stay under **80** per frame. Use `InstancedMesh` or `BatchedMesh` for repeats.
  - Every `.glb` uses Draco or Meshopt geometry compression. No single `.glb` over 5 MB.
  - Every texture ships as KTX2 (Basis Universal). PNG and JPEG are allowed only for the static poster fallback and Open Graph images, which live outside `public/textures`.
  - Exception: project screenshots in `public/projects` ship as WebP. They are page images first (case studies, no-WebGL fallback) and the same atlas feeds the 3D card; block compression would smear their small interface text. About 1.3 MB for all seven projects, loaded only where a project is shown.
  - `npm run budget` enforces file size, compression, and texture format.
- **Lighting and shaders:**
  - Prefer baked lighting on `MeshBasicMaterial`, or custom `ShaderMaterial`, over multiple dynamic shadow-casting lights.
  - At most one shadow-casting light, and only if baked lighting cannot do the job.
- **Motion:**
  - Every animation or camera movement is tied to user intent: scroll progress, pointer, keyboard, or a state transition. Nothing moves just to move.
  - Use damped interpolation (`THREE.MathUtils.damp` with frame delta) for anything that follows input. No raw lerp with a fixed factor, because it is frame-rate dependent.
- **Memory:**
  - Explicitly dispose geometries, materials, textures, and render targets when they leave the scene.
  - Never instantiate `new THREE.Vector3()`, `new THREE.Color()`, or any other object inside the per-frame loop. Allocate scratch objects once at module or class scope.
  - Handle `webglcontextlost` and `webglcontextrestored`. See `ARCHITECTURE.md`.
- **Rendering cost:**
  - Cap device pixel ratio (initial cap 2, lower on weak devices).
  - Render on demand when nothing is changing. Pause rendering when the tab is hidden or the canvas is off screen.

## 5. Copy rules

- Plain, specific language. Say what was built and what it does.
- No em dashes. No contractions. No "delve", "elevate", "seamless", "unleash", "supercharge", "game-changer", or "transform your".
- No invented numbers. Every metric traces to `docs/CONTENT.md`.
