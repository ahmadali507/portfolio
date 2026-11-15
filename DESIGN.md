# DESIGN.md: Anti-Slop and 3D Engineering Contract

This file binds every human and agent working on the site. If a skill, a tutorial, or a prompt disagrees with this file, this file wins. Changes require an entry in `docs/DECISIONS.md`.

## 1. Aesthetic direction

Direction replaced on 2026-11-15 by Ahmad's instruction: **Glass Deck.** Request Path and Kinetic Field are retired. See `docs/DECISIONS.md`.

- **Visual persona:** clean, glossy, and minimal. Giant grotesk type on a pale ground, one night chapter for the work, and a single hero object finished like lacquer and porcelain. Every motion is staged as a beat: entrance, hold, exit.
- **The hero object:** a deck of glossy cards, one per featured project, each carrying that project's generative relief. The deck flies in on load, fans out, lines up while the camera pulls back, then the whole scene recedes into a framed window as the next section rises over it.
- **Continuity:** the canvas persists across navigation. On a case study, that project's card takes the banner; on the work index the deck fans beside the heading. Moving between pages, the cards fly to their new poses.
- **Work chapter:** full-width night cards stack as the reader scrolls; each settles back, tilts, and dims as the next slides over it. Each card's art is a live WebGL plate in the same finish as its 3D card, with a sheen that follows the pointer.
- **What the world must never become:** a particle cloud, a neon wireframe, glowing outlines, or motion that runs with no input. Apart from the load entrance, the scene moves only with scroll, pointer, or navigation.
- **Honesty rule:** reliefs and finishes are visual identity only. They never encode a metric or imply a claim about a project.

### Banned UI patterns (immediate reject)

- No `Inter`, `Roboto`, `Arial`, or `system-ui` as a primary font.
- No purple, indigo, or violet gradients or primaries (`from-purple-500`, `to-indigo-600`, `#6366f1`, `#7c3aed`, and similar).
- No generic three-column symmetrical feature or project cards with `rounded-xl` plus `shadow-lg`. Full-width stacking cards are the only card pattern.
- No glowing neon borders. No glassmorphism (`backdrop-blur`) on cards. Gloss comes from real reflections in WebGL and one-pixel highlights in CSS, never from blur.
- No decorative floating 3D primitives. No aimlessly spinning torus knots, icosahedrons, or wireframe spheres. The only 3D object is the project deck.
- No pill badges with sparkle glyphs or emoji above section headings. No emoji used as icons.
- No gradient-filled heading text.
- No centered hero with two pill buttons as the opening composition.
- No cream background plus serif display plus sage accent as an unexamined default. The replacement for one default must not be another default.
- No stock illustration or stock photography standing in for real work.

### Content ban

- No medical, clinical, health, or academic-medical-research content anywhere: copy, code, alt text, metadata, filenames, placeholders. The site presents Ahmad only as a software engineer. `scripts/slop-check.mjs` enforces a word list on `src/`.

## 2. Typography and color tokens

### Type

| Role                                     | Family           | License     | Settings                                                                                                     |
| ---------------------------------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| Display                                  | Familjen Grotesk | SIL OFL 1.1 | Weight 600 to 700, tracking `-0.02em`, line-height `0.95`, sizes from `clamp(2.5rem, 7vw, 6.5rem)`           |
| Body                                     | Public Sans      | SIL OFL 1.1 | Weight 400 and 600, tracking `0`, line-height `1.55`, base `1rem` to `1.125rem`, measure 60 to 72 characters |
| Mono (labels, metadata, code-like text)  | Commit Mono      | SIL OFL 1.1 | Weight 400, uppercase labels at `0.75rem` with tracking `+0.06em`; span names in sentence case at `0.875rem` |

- Licenses must be confirmed against the LICENSE file shipped with each download before the fonts are committed. Font files are not installed yet.
- Subset to Latin plus the punctuation in use. Preload only the display weight used above the fold. `font-display: swap` with metric-matched fallbacks to limit layout shift.

### Color tokens

| Token               | Value     | Use                                                                                             | Contrast                                                |
| ------------------- | --------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `--color-bg`        | `#EDEDEB` | Page ground                                                                                     | Base                                                    |
| `--color-surface`   | `#E1E2DF` | Hero stage, practice panels                                                                     | 1.1:1 against bg                                        |
| `--color-ink`       | `#1B1D1E` | Primary text, linework                                                                          | 14.4:1 on bg, 13.0:1 on surface                         |
| `--color-ink-muted` | `#4F5456` | Secondary text, captions                                                                        | 6.6:1 on bg, 5.9:1 on surface                           |
| `--color-rule`      | `#A3A7A5` | Hairlines only, never text                                                                      | decorative                                              |
| `--color-trace`     | `#E2401C` | The accent: the vermilion card, active marks, focus rings. Non-text marks and text 24px and larger only on light ground | 3.30:1 on bg, 4.02:1 on ink                             |
| `--color-trace-ink` | `#B02E0E` | Small accent text on light ground; button hover fill with `--night-ink` text (5.5:1)            | 5.5:1 on bg                                             |
| `--night`           | `#0D0E0F` | Night chapter ground (work)                                                                     | Base                                                    |
| `--night-ink`       | `#EDEDEB` | Text on night                                                                                   | 16.5:1                                                  |
| `--night-muted`     | `#9A9FA2` | Secondary text on night                                                                         | 7.2:1                                                   |

- The trace accent covers under 5 percent of any viewport. It marks the one thing that is live right now and nothing else.
- No gradients on UI surfaces. Depth comes from real reflections in the 3D scene and restrained shadows under the stacking cards.
- A dark variant is not in scope. If added later, it needs its own contrast table and a decision log entry.

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
