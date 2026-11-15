# ARCHITECTURE.md

Technical contract for the site. Every decision here has a reason and a cost. Changing one requires an entry in `docs/DECISIONS.md`. API names below were checked against the installed packages (Astro 7.4.12, three 0.187.0, gsap 3.15.1, lenis 1.3.27) on 2026-11-15.

## 0. Shape of the system

- Astro 7, `output: 'static'`. Every route is a real HTML document with all content in it.
- No UI framework integration. The 3D engine is plain TypeScript classes in `src/engine/` on vanilla Three.js.
- Projects come from the `projects` content collection (`src/content.config.ts`, Zod schema). Only entries with `public: true` that are approved in `docs/CONTENT.md` are rendered.

## 1. Persistent canvas across navigation

**Options considered.**

| Option                                             | How it works                                                                                                                                                       | Gains                                                                                                                                                                                     | Costs                                                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. One spatial page plus separate case-study pages | `/` holds the world. `/work/<slug>` pages are plain documents with full page loads.                                                                                | Simplest lifecycle. No router. Case studies stay light.                                                                                                                                   | The world is torn down and rebuilt on every round trip. No continuity between the world and a case study. Re-download and re-compile shaders on return unless cached.                                        |
| B. Astro `ClientRouter` with `transition:persist`  | The shared layout renders `<ClientRouter />` and a canvas host element marked `transition:persist="world"`. Navigation swaps the DOM around the persisted element. | The canvas, GL context, compiled programs, and loaded assets survive navigation. The camera can fly into a project as the page changes. Every page is still a static, indexable document. | Script lifecycle is harder: module scripts run once, so DOM bindings must re-run on `astro:page-load` and be torn down on `astro:before-swap`. Leaks accumulate if teardown is missed. More testing surface. |

**Recommendation: B.** Continuity between the world and the case studies is the main reason to build a 3D portfolio instead of a page with a 3D header, and B is the only option that keeps one GL context alive. The cost is a strict lifecycle, which this document defines below. B also degrades to A for free: if the router is removed or JavaScript fails, links are ordinary links to ordinary pages.

**Rules that come with B.**

- `src/layouts/` holds one base layout that every page uses. It renders `<ClientRouter />` and `<div id="world" transition:persist="world">`.
- The Engine is created once, lazily, and stored as a module singleton. It is never created per page.
- Per-page bindings (DOM anchors, section observers, page-specific scene state) implement `mount(page)` and `unmount()`. `mount` runs on `astro:page-load`. `unmount` runs on `astro:before-swap`.
- Camera transitions between pages start on `astro:before-preparation` and must finish or be cancellable. Reduced motion makes them instant.
- `ClientRouter` fallback stays at its default (`animate`). Astro already disables its transition animations under `prefers-reduced-motion`.

## 2. Engine, loop, scroll, resize

- **One Engine class** owns the renderer, scene, camera, clock, resize, visibility, and context-loss handling. Subsystems (`World`, `CameraRig`, `ScrollSync`, `Assets`) are plain classes the Engine composes.
- **One loop.** `gsap.ticker` is the only `requestAnimationFrame` source. The Engine registers one callback with `gsap.ticker.add`. No other code calls `requestAnimationFrame`.
- **Lenis inside the ticker.** Lenis is created with `autoRaf: false`. The ticker callback calls `lenis.raf(time * 1000)`, then updates scroll-driven state, then renders. `gsap.ticker.lagSmoothing(0)` keeps scroll and render in step after a long frame. If ScrollTrigger is added later, `lenis.on('scroll', ScrollTrigger.update)` wires it in; ScrollTrigger is not installed yet.
- **Frame order:** Lenis step, read scroll and pointer, damp state toward targets with frame delta, update uniforms and camera, render (only if something changed or an animation is active).
- **One resize path.** A single `ResizeObserver` on the canvas host feeds the Engine. The Engine updates renderer size, pixel ratio, camera aspect, and DOM-anchor measurements in that one place. Nothing else listens to `resize`.
- **Visibility.** On `visibilitychange` to hidden, the Engine stops rendering and pauses Lenis. An `IntersectionObserver` pauses rendering when the canvas host is off screen.

## 3. DOM-to-WebGL sync for scroll

- The DOM is the source of truth for layout. WebGL never decides where content is.
- Elements that have a 3D counterpart carry a `data-world-anchor` attribute. On `mount` and on resize, the Engine measures them once with `getBoundingClientRect()` plus the current scroll offset and caches document-space rectangles.
- Each frame uses only the cached rectangles and the current Lenis scroll value to place counterparts. No layout reads inside the frame loop.
- The camera uses an orthographic-equivalent mapping for anchored planes (world units per CSS pixel fixed at the anchor depth), so a plane and its DOM element line up exactly at rest. Effects such as bend or parallax are offsets from that rest state, driven by scroll velocity, and fall to zero under reduced motion.
- Global scroll progress for camera paths comes from section anchors, not from raw `scrollY` divided by page height, so adding content does not retime the camera.

## 4. Progressive enhancement and failure handling

- **No WebGL, no JavaScript:** every page is complete, readable, and indexable as HTML. Project text, links, and navigation never depend on the canvas.
- **Static poster fallback:** the canvas host contains a static poster image (AVIF or WebP with a JPEG fallback, sized for mobile and desktop) as its initial content. The Engine replaces it only after the first frame renders. If WebGL2 is unavailable, initialization throws, or the device is judged too weak, the poster stays.
- **Capability gate:** before loading the 3D bundle, check WebGL2 support, `navigator.connection.saveData`, and reduced-motion. Device tiering beyond this (for example `detect-gpu`) is deferred until a real device test shows the need.
- **Context loss:** listen for `webglcontextlost` (call `preventDefault`, stop the loop, show the poster) and `webglcontextrestored` (re-upload assets from the in-memory cache, resume). After a second loss within a short window, stay on the poster for the session.
- **Errors:** any exception during Engine init or a frame stops the loop, restores the poster, and logs once. The page must keep working.

## 5. Loading strategy and budgets

- The HTML, CSS, and fonts render the first paint. No 3D code is in the critical path.
- The 3D bundle is a dynamic `import()` triggered after first paint, inside `requestIdleCallback` with a timeout fallback, and only if the capability gate passes.
- Models and textures load after the Engine starts, in priority order, with the poster visible until the first meaningful frame.

| Budget                            | Target                 | Measured on                                   |
| --------------------------------- | ---------------------- | --------------------------------------------- |
| LCP                               | under 2.0 s            | Mobile, throttled 4G, mid-tier device profile |
| CLS                               | under 0.05             | All pages                                     |
| INP                               | under 200 ms           | All pages                                     |
| Initial JS before the 3D bundle   | under 20 KB gzip       | Home page                                     |
| 3D bundle (three plus engine)     | under 200 KB gzip      | Lazy chunk                                    |
| Total JS on any page              | under 260 KB gzip      | Including the lazy chunk                      |
| Total scene assets on first visit | under 4 MB transferred | Home page                                     |

These are starting targets. They are measured, not assumed, at the first milestone and adjusted only with a decision log entry.

## 6. WebGL2 first, WebGPU later

- **Start with `WebGLRenderer` and GLSL `ShaderMaterial`.** Reasons: WebGL2 has the widest device support; the headless screenshot pipeline (SwiftShader) is reliable with it; the `three/webgpu` build is larger than the core build; and most mature tooling (post-processing libraries, examples) still targets WebGL.
- **Keep the path open.** Renderer creation lives in one factory inside the Engine. Shaders live in their own modules with uniforms declared in one place, so each can later be ported to TSL. No `onBeforeCompile` patching of built-in materials, because it does not carry over to node materials.
- **When to switch:** when a feature needs compute shaders or WebGPU-only capability, or when `WebGPURenderer` with its WebGL2 fallback meets the bundle budget and passes the screenshot pipeline. That switch is a decision log entry and a separate milestone.
- **Recommendation:** do not start on WebGPU or TSL. Nothing in the current brief needs compute, and starting there adds bundle weight and testing risk before any content exists.

## 7. Directory map

- `src/engine/`: Engine and subsystems. No Astro imports.
- `src/components/`, `src/layouts/`, `src/pages/`: Astro markup.
- `src/content/`: content collections. `src/content.config.ts` holds the schemas.
- `src/styles/`: tokens and global CSS.
- `public/models/`, `public/textures/`: compressed runtime assets only.
- `scripts/`: verification tooling (`slop-check`, `asset-budget`, `shot`).
- `.claude/skills/`: vendored agent skills, pinned in `.claude/skills.lock.json`.
