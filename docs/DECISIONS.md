# DECISIONS.md

Dated decision log. Newest entries at the bottom. Each entry states the decision, the reason, and the cost.

## 2026-11-15

- **Package manager: npm 11.20.0.** pnpm is not installed. Node 26.13.0 meets Astro 7.4.12's requirement (`>=22.23.4`).
- **Astro 7.4.12, minimal template, static output, TypeScript `strictest`.** `create-astro@5.3.2` no longer has a TypeScript flag, so `tsconfig.json` extends `astro/tsconfigs/strictest` by hand. Path alias `@/*` maps to `src/*`.
- **TypeScript pinned to 6.0.3, not 7.0.2.** `typescript-eslint@8.72.2` requires `<6.1.0` and `@astrojs/check@0.9.12` requires 5 or 6. Revisit when both support 7.
- **No UI framework. Vanilla Three.js in plain TypeScript classes.** Reason: one persistent canvas with no island hydration boundaries. Cost: no access to the R3F and drei ecosystem.
- **Exact pins:** three 0.187.0, @types/three 0.187.0, gsap 3.15.1, lenis 1.3.27. Dev tooling pinned exact as well.
- **Playwright browsers installed into `node_modules`** (`PLAYWRIGHT_BROWSERS_PATH=0`) to keep everything inside the project.
- **Vite treats `.glb`, `.gltf`, `.ktx2` as assets** through `assetsInclude`.
- **Projects collection** uses the `glob` loader with a Zod schema (`astro/zod`) and `public` defaulting to false.
- **Skills audited and vendored at project scope.** See `docs/SKILLS.md`. Impeccable installed as markdown only. Taste Skill installed with its Stop hook removed. Blender integration in 3dviz-pro-max removed.
- **Persistent canvas: Astro `ClientRouter` with `transition:persist`.** Reason: one GL context survives navigation, enabling continuity into case studies. Cost: a strict mount and unmount lifecycle on `astro:page-load` and `astro:before-swap`. See `ARCHITECTURE.md` section 1.
- **One loop on `gsap.ticker`, Lenis with `autoRaf: false` inside it, one `ResizeObserver` resize path.**
- **WebGL2 first.** `WebGPURenderer` and TSL deferred until a feature needs them. See `ARCHITECTURE.md` section 6.
- **Budgets from DESIGN.md win over the playbook:** 150k triangles and 80 draw calls.
- **Performance targets:** LCP under 2.0 s, initial JS under 20 KB gzip, 3D chunk under 200 KB gzip, total JS under 260 KB gzip. To be measured at the first milestone.
- **Gate 2: Direction A, Request Path.** One request travels a machined track through stations that map to the real stack, with a distributed-trace panel synced to the packet. Chosen over B (Proof Lattice: most distinctive, most abstract) and C (Retrieval Atlas: needs a build-time embedding dependency). Reason: the clearest link to client work, and it degrades into an honest HTML trace.
- **Type:** Familjen Grotesk (display), Public Sans (body), Commit Mono (mono). All SIL OFL 1.1, self-hosted. Licenses to be confirmed against the shipped LICENSE files when the fonts are added. No font packages installed yet.
- **Palette:** machined gray `#E3E4E2`, surface `#D2D4D1`, graphite ink `#1B1D1E`, muted `#4F5456`, rule `#9DA2A0`, trace vermilion `#E2401C` (non-text and large text only), trace ink `#B02E0E` (small text on bg only). Contrast ratios recorded in `DESIGN.md`.
- **Trace honesty rule:** the trace panel shows stage names and order only. No latency or throughput figures.
- **Direction A budget plan:** at most 8 stations at 6 draw calls and 12,000 triangles each, totaling 80 draw calls and 150,000 triangles with headroom. See `ARCHITECTURE.md` section 8.

## 2026-11-15 (build, step 1: engine shell)

- **Python 3.13.17 installed (python.org, user scope, via winget)** so the `unslop-ui` and `unslop-text` scanners run. A `python3.exe` copy sits next to `python.exe` because the skills call `python3`. Sessions started before the install still resolve the Microsoft Store alias, so call the full path (`%LOCALAPPDATA%\Programs\Python\Python313\python3.exe`) until the editor restarts.
- **The untracked `portfolio/` folder is a byte-identical nested clone with its own `.git`.** It is not deleted (not created here). It is excluded from ESLint, `astro check`, and Prettier so it cannot break `verify`. Ahmad should delete it or move it out.
- **Fonts: `@fontsource/familjen-grotesk`, `@fontsource/public-sans`, `@fontsource/commit-mono`, all 5.3.0, pinned exact.** Pre-approved. Each ships an SIL OFL 1.1 `LICENSE` file, checked. Only Latin subsets and the weights in use are imported (Familjen 600/700, Public Sans 400/600, Commit Mono 400). The display 700 and body 400 files are preloaded.
- **Fallback faces are metric-matched.** Ascent and descent come from each font's `hhea` table, read from the shipped WOFF files. `size-adjust` is measured in Chromium (see step 2 entry).
- **Engine shape.** One `Engine` class owns the renderer, scene, camera, one `gsap.ticker` callback with `lagSmoothing(0)`, Lenis (`autoRaf: false`, `lerp: 0.11`, `respectReducedMotion: true`), one `ResizeObserver`, visibility, context loss, and disposal. Scene parts implement a `WorldPart` interface (`update`, `resize`, `mount`, `unmount`, `setTier`, `dispose`). `deltaTime` from the ticker is the only clock; `THREE.Timer` is not used, so there is one time source.
- **Render on demand.** A frame renders only when a part reports a change, the Engine was invalidated, or a resize or quality change happened. Lenis still steps every tick.
- **Adaptive quality.** The interval between consecutive rendered frames feeds a 60-sample median. Above 18.6 ms (16.6 ms plus 12 percent vsync allowance) the pixel ratio drops one step (2, 1.75, 1.5, 1.25, 1, 0.85). It steps back up at most twice, after four windows under 12.5 ms, never above the initial cap. Initial cap: 2 on fine pointers, 1.5 on coarse pointers. Tier 2 when the first two seconds average over 22 ms, per ARCHITECTURE.md section 8.
- **Context loss.** First loss: `preventDefault`, stop, poster. Restore: resume. A second loss within 60 seconds keeps the poster for the session and disposes the Engine.
- **Capability gate** (`src/scripts/world-gate.ts`, the only initial JS besides the router): WebGL2 probe, `saveData`, and a `?world=off` switch for testing the no-WebGL path. It schedules the dynamic `import()` after the `load` event inside `requestIdleCallback` (2.5 s timeout). Reduced motion does not block the world; the world renders a static frame instead.
- **Dev-only stats overlay** behind `import.meta.env.DEV`, written in place (no `stats.js` dependency). `window.__world.info()` exposes counters in every build for the measurement script.
- **Canvas host is `100lvh` tall**, so mobile address-bar changes do not trigger resizes.
