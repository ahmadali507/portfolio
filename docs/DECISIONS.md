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
