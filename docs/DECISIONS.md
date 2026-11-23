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

## 2026-11-15 (build, steps 2 and 3: content, layout, and the world)

- **Direction A (Request Path) retired at Ahmad's instruction.** Ahmad rejected the seven-stage concept and asked for strong 3D effects that show front-end engineering craft. Removed: station data, trace panel, stage sections, path marks, path schematic, and every "request path" label. `DESIGN.md` section 1 and `ARCHITECTURE.md` section 8 were rewritten. Palette, type, bans, accessibility rules, and budgets are unchanged.
- **New direction: Kinetic Field.** One instanced field of machined pins with GPU-computed generative reliefs: the pointer lifts pins (accent tops) and sends ripples, scrolling flattens and fades the field, and each page morphs the field to its own relief through the persistent canvas. Project covers are WebGL planes mapped onto DOM boxes, with shaded relief, contour lines, perspective tilt toward the pointer, a hover ripple, and a scroll-velocity bend. Chosen because it is interactive, procedural (no downloaded assets), cheap (9 draw calls, about 60,000 triangles at tier 1), and keeps the matte machined persona. Full plan in `docs/SCENE.md`.
- **Pointer lifts pins rather than pressing them.** At the camera angle, pressed tops hide behind their neighbors, so the accent never showed. The lift holds while the pointer rests on the field.
- **Text never depends on the scene for contrast.** Each page marks one `data-world-stage` band where the field lives and `data-world-zone` text blocks. The shader fades the field to `--color-bg` under zones and below the stage. Content blocks outside the stage keep a solid ground.
- **Field grid: 80 x 50 pins at tier 1, 56 x 36 at tier 2.** The first 104 x 64 grid read as a tiled floor; chunkier pins read as a sculpture and cost less.
- **Patterns are visual identity only.** One height function per id, in TypeScript (`src/lib/patterns.ts`, used for the SVG fallbacks and the poster) and in GLSL (`src/engine/shaders/patterns.ts`). Featured projects get fixed patterns; the rest get seeded variants.
- **Draft preview switch.** `DRAFT_PREVIEW` in `src/config/site.ts` renders every project for local drafts. With it false, a project renders only when `public: true` and its `docs/CONTENT.md` row says "Approved". The build reads that table directly, so CONTENT.md stays the single source of approval.
- **Dummy data model.** Every dummy field is `{ value, placeholder }`. Placeholders render a visible TODO tag. Project names and the one-line summaries Ahmad supplied are not flagged. Tax-Lens, CARTX, SearchX, and Waynna had no summary, so they show a flagged placeholder rather than an invented one.
- **`npm run prelaunch`** (not part of `verify`) fails on `placeholder: true`, `[Surname]`, `DRAFT_PREVIEW = true`, links to `#`, `<Todo>` markers in templates, and any CONTENT.md fact not marked Confirmed.
- **Sitemap and robots are hand-written endpoints** instead of `@astrojs/sitemap`, to avoid a dependency for a handful of routes.
- **Measured font fallbacks** (`scripts/font-fallback.mjs`): Familjen Grotesk 91.27 percent of Arial, Public Sans 103.66 percent of Arial, Commit Mono 99.98 percent of Courier New.
- **Shot script options added:** `--scroll`, `--full`, and `--hover` (sweeps the mouse before the capture so pointer effects show).
- **unslop-ui scanner:** clean. **unslop-text scanner:** clean on all built page copy (3,683 words) and on new docs. It does not read `.astro` files, so copy is checked from the built HTML.

## 2026-11-15 (redesign: Glass Deck)

- **Kinetic Field retired at Ahmad's instruction.** Feedback: nothing revealed, nothing orchestrated. Asked for a clean, glossy, minimal site with cinematic scroll (stacking cards, a zoom-out of the screen), modeled on leading 3D developer portfolios. Research pointed to one hero object with real material response, a camera that travels in depth, sections staged as entrance, hold, and exit, and one scroll chapter per project.
- **New direction: Glass Deck.** A deck of glossy cards, one per featured project, choreographed by scroll: load entrance, fan, row with camera pull-back, zoom-out into a framed window, then exit as the statement rises. The work chapter is a night section of stacking cards. See `DESIGN.md` section 1 and `docs/SCENE.md`. This reverses the earlier "matte, nothing glossy" persona; DESIGN.md is updated.
- **ScrollTrigger adopted.** It ships inside the installed `gsap` 3.15.1 package, so no dependency was added. Registered once in `src/motion/core.ts`, wired to Lenis with `lenis.on('scroll', ScrollTrigger.update)`.
- **Loop ownership moved to `src/motion/core.ts`.** Lenis, the single `gsap.ticker` callback, and ScrollTrigger now load for every visitor with JavaScript, not only when WebGL runs, so scroll choreography works without 3D. The Engine subscribes to that loop. Still one `requestAnimationFrame` source.
- **Shared motion state (`src/motion/state.ts`).** ScrollTrigger callbacks write progress; the engine reads it each frame. The 3D story needs no layout reads.
- **The WebGL canvas moved above the content** (transparent, `pointer-events: none`, below the header). Reason: plates must show inside dark, opaque sections and inside sticky cards. Stacked plates discard pixels below the next card's top edge, and read the card's dim value as a uniform.
- **Tracked plates read layout per frame.** Plates in sticky, scaled, or pointer-following containers (`data-plate-track`, at most 6 per page) call `getBoundingClientRect` each frame. This relaxes ARCHITECTURE.md section 3 for those plates only; everything else still uses cached rectangles.
- **Reflections from `RoomEnvironment` through `PMREMGenerator`**, rendered once at startup. No HDR download. Neutral tone mapping on the renderer; plates opt out of tone mapping to match CSS colors.
- **Card faces are rendered once into render targets** from the same pattern shader as the plates, then mapped onto clear-coated `MeshPhysicalMaterial`.
- **The poster image is replaced by page-level fallbacks:** CSS 3D cards with SVG reliefs in the home hero, and SVG reliefs inside every plate.
- **Palette lightened for a cleaner ground:** bg `#EDEDEB`, surface `#E1E2DF`, rule `#A3A7A5`, plus a night theme (`#0D0E0F`, ink `#EDEDEB`, muted `#9A9FA2`). All contrast pairs were recomputed (ink 14.4:1, muted 6.6:1, night ink 16.5:1, night muted 7.2:1, button hover 5.5:1).
- **CSS-only entrance on first paint** (letters rise, blocks fade up), so the hero never waits for JavaScript and LCP is not held back. Scroll reveals below the fold are added by JavaScript only.
- **Page transitions:** the old page settles back to 94 percent and dims while the new one wipes up with a clip-path; the header has its own transition name and does not animate. Under reduced motion Astro drops the animation.
- **Removed:** the pin field (`Field.ts`), the Kinetic Field text zones and stage bands, the line-relief poster, `FeaturedWork` and `WorkLedger`.
- **New tooling:** `scripts/film.mjs` captures a sequence of frames at scroll positions to review choreography.

## 2026-11-16 (dark theme, liquid splash, wheel gallery)

- **Dark theme site-wide at Ahmad's instruction.** Ground `#0A0B0C`, surface `#131516`, ink `#EDEDEB`, muted `#9A9FA2`, rule `#2A2D2F`. Small accent text uses `#F0805F`; the deep accent `#B02E0E` is kept only as a button hover fill. All pairs recomputed and recorded in `DESIGN.md`. The separate night theme is gone.
- **Liquid splash, after the reference Ahmad supplied** (a fluid shape following the cursor that reveals the inverted theme). Built as a fed-back mask on its own canvas with `mix-blend-mode: difference`, so real DOM text and the 3D cards invert without duplicating any content. Raw WebGL2, no added dependency, two draw calls while active and none at rest. Cost: a second small GL context and a full-screen blend layer.
- **The liquid canvas keeps its own `ResizeObserver`.** It must run when the three.js engine does not, so it cannot share the Engine's. This is the one exception to the single resize path.
- **Stacking cards removed; Ahmad called them ordinary.** The work chapter is now a pinned wheel gallery driven by the same 3D deck: `motion.workPos` is eased per segment so each card dwells at the front. Without WebGL the gallery shows SVG reliefs; without JavaScript or under reduced motion it is a plain list.
- **Card finishes reordered for a dark ground:** porcelain, vermilion, graphite, pearl, obsidian.
- **Card art uses mipmaps** so contours stay smooth when cards are small or angled.

## 2026-11-16 (live cards, chemistry heading, one-by-one gallery, positioning)

- **Card faces are motion graphics, not abstract reliefs.** Ahmad called the contour cards placeholders that portray nothing. Each featured project now has an animated diagram of what it does, plus its name and a two-word kind on the card. The same scenes drive the case-study covers and the work-index preview. The SVG relief stays only as the no-WebGL fallback.
- **Kinds on cards** (Collaborative editor, Document Q&A, Content platform, Call routing, Storybooks) restate Ahmad's one-line summaries. No new facts.
- **Performance regression found on Ahmad's machine and fixed.** With five 1024 x 640 faces redrawn every frame the stats overlay showed about 20 ticks a second. Faces are now 768 x 480, two are refreshed per frame in turn, and the longest shader loop was shortened. Not yet re-measured on that machine.
- **Hero row removed.** Ahmad asked for cards to arrive one by one and travel upward, not line up. The hero pin is shorter (170svh): the deck stays a deck while the scene pulls back into its frame. The gallery is a vertical conveyor with a dwell at each project.
- **Chemistry in the heading**, after Ahmad's second reference. Twelve procedural phenomena cycle through the letters with reaction-front transitions. Darken blending with output clamped to the ground color keeps the ground untouched and the DOM text real. A third small WebGL context per page; half-rate drawing keeps it cheap.
- **Autonomous motion allowed for card graphics and the heading only.** This relaxes the earlier rule that nothing moves without input. Both stop under reduced motion and when off screen.
- **Positioning revised by Ahmad:** a software engineer with an entrepreneurial mindset, not an AI or RAG specialist. Copy now leads with building products end to end and co-founding the agency; AI systems are one practice among five. Every statement comes from facts already in `docs/CONTENT.md`.

## 2026-11-16 (hero hands over to the gallery)

- **Hero zoom-out removed at Ahmad's instruction.** The hero is an ordinary first screen again, not pinned. The work gallery now follows it directly, and the statement moved after the gallery.
- **The deck opens into the gallery.** As the gallery rises, each card blends from its place in the deck to its place in the one-by-one sequence, and the group grows from hero size to gallery size. The top card therefore zooms in to the center; the rest wait below and come up in turn.
- **Adaptive quality made less trigger-happy.** Ahmad's overlay showed tier 2 at a 0.85 pixel ratio, which is visibly soft. The first 90 rendered frames are now ignored (shader compilation), a slow start drops one pixel-ratio step instead of two, and the ratio never goes below 1.
- **Bug fixed:** `Quaternion.slerpQuaternions` copies its first argument into the target before interpolating, so using the target as the second argument returned the first unchanged. The blend now interpolates into a scratch quaternion.

## 2026-11-19 (real projects, layered motion graphics)

- **Project set replaced at Ahmad's instruction.** Projects now come from the Project Knowledge Base in Muhammad Amjad's Notion workspace and the OnePercent folder in Google Drive. Fourteen entries, six featured (MagicalBook.Store, Vakse, Codesmash, Shocodoc, MenuMatch, TaxLens). Old dummy entries that are not in either source were removed. Sources, exclusions, and open questions are in `docs/CONTENT.md`.
- **Screenshots are reference, not media.** Ahmad asked for motion graphics instead of the pictures. Each project has a palette taken from its own interface and a ten-second scene that acts out what the product does (bids arriving, two editors racing, carets meeting in a document, a QR code resolving to a menu). No screenshot, photo, or logo is shipped.
- **Every card is a three-layer diorama.** A scene draws into a ground, a surfaces layer, and a lift layer in one pass with multiple render targets (WebGL2, GLSL 3). The ground goes on the glossy card face; the other two sit on transparent planes in front of it with premultiplied alpha. When a card is in front or under the pointer the layers part along depth, so the interface lifts off the card in real 3D. Covers use the same scene and composite the layers in one pass with pointer parallax.
- **One scene per material.** Each card and cover compiles only its own scene through a `SCENE` define, so a shader carries one scene's branches instead of fourteen. Covers rebuild their material when the work-index preview switches project.
- **Only the lead card redraws every frame;** one other card refreshes per frame in turn. Same budget as before.
- **Ground layer stays linear in the shader.** The render target attachment is sRGB, so the hardware encodes on write. Encoding by hand washed every face out.
- **Non-featured case pages send the deck away** instead of showing unrelated cards beside the title; their cover carries the motion graphic. Parked cards now sit far below the band so they cannot scroll into the content.
- **Long project names step down in size** and break only after a dot.

## 2026-11-21 (real screenshots under the motion graphics)

- **Real project screenshots are shown, at Ahmad's request.** He wanted the actual product images from Drive with motion graphics on them, not drawn diagrams. Seven projects have screenshots. CLAUDE.md content rule 2 required approval for screenshots; Ahmad's instruction is recorded as that approval in `docs/CONTENT.md`, together with every edit.
- **Edited, not raw.** Names, emails, Ahmad's unapproved surname, a real child's photo, marketing figures, and streamer handles are blurred or cropped out by `scripts/project-shots.mjs`. The raw files stay outside the repository. One screenshot (an admin dashboard with revenue) is not used.
- **The motion graphic works on the real screens.** Each shot plays in a floating browser window with a slow push; shots change through a staggered slice wipe; a scan beam, focus brackets, a clicking cursor, and a magnified loupe that lifts onto the top layer point at the part of the screen that matters. Same three layers as before, so the window floats above the card and the loupe above the window.
- **WebP, not KTX2, for screenshots.** They are page images as much as textures, and block compression blurs interface text. One atlas per project feeds the 3D card; individual 1600 px images serve the case pages and every fallback. DESIGN.md records the exception.
- **Half-float card layers.** Dark screenshots banded badly in 8-bit linear targets. The card art now renders to half float when the GPU supports it, with the old 8-bit sRGB path as fallback.
- **Case pages gain a Screens section** with each shot full size and a caption. Without JavaScript or WebGL, covers and the gallery list show the first screenshot instead of the generated relief.
- **Gallery card enlarged** (desktop and mobile) so the screens read.
- **Verified on the real GPU.** Earlier review frames came from a software renderer only. This round was also checked on Ahmad's machine (Intel UHD 630 through Direct3D 11), on the dev server and the production build.

## 2026-11-21 (surname and larger project cards)

- **Surname is Ali.** Ahmad supplied it; `SURNAME` in `src/config/site.ts` and the Name row in `docs/CONTENT.md` are updated. The screenshot blurs over his surname stay for now; they can be lifted by rerunning `scripts/project-shots.mjs` with those rectangles removed.
- **Cards sized from the viewport, not fixed world units.** Ahmad found the gallery cards too small to show anything. The front gallery card now fills the right half of the screen (up to 60 percent of its height) and the hero deck takes about 30 percent of the width. The card turns less toward the copy (0.14 rad), so the screen reads square.
- **Larger browser window on the card face.** The screenshot window now takes the face above the title strip (height 0.68 of the face, width up to 1.5). Cover plates zoom out to match.

## 2026-11-21 (hero about Ahmad, typed roles)

- **The hero is about Ahmad, with no cards.** He asked for the first screen to be about him, with a typewriter in the center naming what he does. The name is centered and keeps its chemistry phenomena; a typed line cycles through six roles; a row under it lists every role and marks the current one, which also gives screen readers and no-JavaScript visitors the full list.
- **Centered composition, an exception to DESIGN.md.** The ban on a centered hero targets the default "centered headline and two pill buttons". This hero stays centered at Ahmad's request and keeps one pill button beside a text link. DESIGN.md records the exception.
- **How the typing looks.** Each letter settles in from a blur; a finished role holds, is marked like a selection in an editor, then clears; one vermilion caret blinks only while idle. It runs on the shared gsap.ticker loop with letter spans built once at mount, keeps its own clock, pauses off screen or in a hidden tab, and does not run under reduced motion.
- **Roles.** Four come from Ahmad's message; Full-Stack SaaS Developer and Automation Engineer come from the approved Builds row. Logged in CONTENT.md.
- **Cards enter with the gallery.** With the deck gone from the hero, the gallery cards rise from below the fold at gallery size as the section scrolls in. The CSS fallback deck in the hero is removed.
- **Chemistry heading box fixed.** The chemistry canvas reached the heading wrapper's partly transparent edge pixels and drew a faint box around the name. The canvas is now inset 3 px.

## 2026-11-21 (practice section as a 3D drum)

- **"What I build" is a pinned drum, not a sideways track.** Ahmad found the sideways track flat, and its heading slid off screen with the panels. The five practices now sit on the faces of a five-sided prism in CSS 3D. Scroll turns it one face at a time with a dwell on each, damped in the shared frame loop. The next face rolls up from below; faces turning away darken as if lit from the front and their copy fades; the number, title, tools, and project links float at different depths so they parallax as it turns; the pointer tilts the whole drum; on the way in it rises and stands up from a tipped-back pose. A counter and a row of practice names mark the face in front. The heading and the row sit in front of the drum.
- **"Seen in" uses real stacks only.** Each face lists the projects whose confirmed stack names one of its tools. Projects with a placeholder stack are never listed, so Mobile apps and Automation show none yet.
- **Fallbacks.** Without JavaScript or under reduced motion the faces are a plain list of panels.

## 2026-11-21 (3D hero background, floating name, adverb and role)

- **The hero gets a 3D background tied to the roles.** Ahmad asked for 3D animation behind the hero with real-world effects. DESIGN.md bans abstract decoration that says nothing about the work, so the field is six objects, one per role in the typed line: code brackets (Software Engineer), a chip (AI & LLM Engineer), a phone (Web & Mobile App Developer), a cloud (Cloud Solutions Architect), a laptop (Full-Stack SaaS Developer), and a gear that keeps turning (Automation Engineer). They are modelled from simple solids in physical materials (clearcoat ceramic, brushed steel, gold pins, a pearl cloud) and lit by the room environment. They float at the edges, lean with the pointer, and the object for the role being typed comes forward and turns to face the reader.
- **The world layer goes beneath the page in the hero.** The single world canvas normally sits above the page so cards can draw over sections. In the hero it drops beneath the page content instead, so the objects sit behind the copy; it returns above the page as the work section rises, after the objects have sunk out. One engine, one renderer, one loop, as before.
- **Tall screens show one object.** On a phone the six objects would cover the copy, so only the current role's object shows, above the name, and it swaps as the role changes.
- **The name floats.** Each letter bobs and tilts in depth on its own phase after rising in. It uses the separate translate and rotate properties, so it stacks on the rise-in transform; reduced motion holds it still.
- **Adverb and role.** "I am" is gone. Each role types after an adverb (Thoughtfully, Practically, Fluently, Reliably, Thoroughly, Quietly) on its own line, the adverb in the accent ink and the role in full ink. The adverbs are copy, not claims.
- **Known cost, not new.** On first load the main thread blocks for about four seconds while the project card shaders compile, which delays the first typed role. It predates this change (measured without the hero objects); the hero objects add under a second. Worth a follow-up: compile the card art lazily as the gallery approaches.

## 2026-11-21 (the hero stands on a keyboard)

- **A full 3D stage under the hero.** Ahmad said the hero had 3D objects but no 3D background for the section to stand on. The stage is a full-size keyboard, modelled key by key in physical materials, laid under the hero and tilted toward the reader, running off both edges on wide screens. A keyboard says what the work is made with, and it ties to the typed line: every key the line strikes goes down and springs back, capitals hold shift, the ampersand is shift and 7, and the clear presses delete. The return key carries the deep accent.
- **Grounded objects.** The floating role objects cast soft shadows straight down onto the keys, wider and fainter the higher they hang, so they read as hanging over a real surface.
- **Readable copy over it.** The keys are near black with dim legends and low reflections, and the board falls off into the page colour at its edges, so the role list, the lead, and the actions keep their contrast over it.
- **Leaving the hero.** The keyboard draws back and fades as the reader scrolls and fades out above the top edge of the next section, which is opaque and would otherwise cut across it. Under reduced motion the keys never move.
- **Cost.** Three draw calls and about 58k triangles on tier 1 (fewer on tier 2), one canvas texture for the legends. A key stroke writes one uniform value; nothing is uploaded per frame.

## 2026-11-23 (experience, testimonials, richer case studies, new home order)

- **Home page order.** Ahmad asked for: hero, what I build, experience, projects, with testimonials shown. The home page now runs hero, What I build, the short version (the scrubbed statement), Experience, the project gallery, Testimonials, About, and the call to action.
- **What I build carries proof.** Each face of the drum now has one plain line and up to three proofs: a project and the specific mechanism in it, linked to its case study. The proofs come from the Projects Knowledgebase in Notion and the CV. Real-time work sits under Full-stack SaaS because the drum has five faces.
- **Experience is a rail with three chapters:** Upwork, Doerz, and OnePercent Technologies, oldest first. The rail fills with scroll and each marker lights as its chapter is reached; without JavaScript it is a plain ordered list. Dates that are not settled carry a visible flag.
- **Testimonials are a client's recording, not written copy.** The section quotes the endorsement video from its captions and lists the five reasons the client gives. The video file is self-hosted and the section shows a placeholder until the file is added. Written Upwork reviews are not in Drive or Notion, so their place holds a visible TODO and no invented text.
- **Case studies tell a story.** The content schema gained `hook`, `signature`, `strengths`, `features`, and `proves`. The page now runs: hook, cover, facts, the part to remember, the problem, real screens, engineering strengths, how it works, what the user gets, outcome, what it proves, links. Problem and outcome are left off the page while they are placeholders, and the draft note names what is missing. Thirteen of fourteen entries were enriched from the KB and the CV; HundredPov has no source and is unchanged.
- **Figures.** Business figures from the KB and the CV stay withheld (prices, percentages, user counts). Design facts that describe the build are now allowed. See docs/CONTENT.md.
- **Not changed.** The hero is unchanged while Ahmad chooses among the prototypes, and the site keeps its current typefaces until that choice is made.

## 2026-11-23 (cobalt, Syne, one floating object, estimate page)

- **New visual system.** Ahmad chose the direction from a set of prototypes: black and white with one cobalt accent (`#4C6FFF`), Syne for display type, after the type of the OnePercent Technologies site, with Public Sans for body text and labels. That site sets its body in Arial, which the slop check here bans as a primary font, so Public Sans stays. This replaces the earlier dark theme with a vermilion accent, Familjen Grotesk, and Commit Mono. `@fontsource/syne` was added (the `@fontsource` family was already approved); the Familjen Grotesk and Commit Mono packages are no longer imported but stay installed until Ahmad approves removing them.
- **Hero: one floating object at a time.** The six role objects stay, but only the current role's object is on screen, beside the name. The keyboard stage, the six-object field, the fill effect inside the name, and the floating letters are gone. `HeroKeyboard.ts` was deleted.
- **A grid of cells behind the hero.** After the hero of abdullahmansoor.dev, at Ahmad's request, rebuilt as one shader and not copied: hairline cells, an opening flash from the centre, random cells that light and fade (some in cobalt), and a trail under the pointer. The flashes are white and cobalt, not that site's green.
- **Less text.** What I build is five one-line rows. Experience is three short chapters. The 3D drum and the long experience rail are no longer on the home page.
- **Reviews are a centred carousel** that advances by itself and stops once the reader uses the buttons. It holds the client's lines from the recorded endorsement. Written Upwork reviews could not be read (Upwork blocks automated access) and join the carousel once Ahmad pastes them.
- **Estimate page.** `/estimate/` mirrors the estimate tool on the OnePercent site: same questions, prices, and formula (`src/config/estimate.ts`). It is a plain form of radio buttons, checkboxes, and a range input; a small script adds the running total and opens an email with the answers.
- **Scroll.** Section titles drift sideways as they cross the screen, rows rise in, the experience line fills, the hero copy sinks as the reader leaves, and the 3D object leaves a little slower than the page. All of it is scrubbed to scroll and off under reduced motion.

## 2026-11-23 (stacked cards, vertical journey, floating reviews, lower estimate)

- **What I build stacks.** Ahmad asked for the section to stack up on scroll. Each capability is a card that sticks a little lower than the one before it, so the five pile up; the cards underneath shrink back and dim as they are covered. The stacking is CSS sticky and works without JavaScript; the shrink and dim are scrubbed to scroll.
- **The journey runs down the page.** The experience section is a vertical line with three chapters. The heading holds its place while the chapters pass, and the line fills with a long scrub so it trails the scroll and reads as slow. The horizontal title drift was removed from this section.
- **Reviews float on an arc.** After the carousel on the OnePercent site: the current card faces the reader, the others lean in from the sides and fade, and each card drifts slightly. It turns by itself and a side card can be clicked forward. The first card is the client story that site publishes; the rest are lines from the same client's recorded endorsement.
- **Estimate prices cut to about a quarter.** Ahmad said the agency's prices read as too high for his own page. Every price is about 25 percent of the agency's and totals round to the nearest 100 dollars; the weeks are unchanged.
- **Scroll positions are measured again when the page height changes.** A stale measurement made the engine think the project gallery had begun while the reader was still in an earlier section, so gallery cards were drawn over the page. `src/motion/core.ts` now watches the page height and refreshes the triggers.

## 2026-11-23 (amber, no splash cursor, the trail)

- **The accent is amber.** Ahmad picked the amber from the prototypes (`#FFB224`) over the cobalt chosen earlier the same day. Tokens, the hero object, and the grid take it.
- **The liquid splash is gone.** Ahmad asked for the paint-like pointer effect to go. `src/motion/liquid.ts`, its canvas, and its styles were deleted. This reverses the 2026-11-16 decision that added it.
- **The pointer bends the hero grid instead.** Minimal and a little uncanny, as asked: no cells are filled. The grid lines bow outward around the pointer, a slow ripple travels through them, nearby lines take the accent, and the nearest crossings light as points. It is the same single shader as before (`HeroGrid.ts`), with a smoothed pointer position.
- **The trail.** A thick amber line runs down the home page after the hero and draws itself with scroll, like a snake following the reader. It wobbles down the page gutter and sweeps across at each section boundary, through the empty padding, so it never sits under a line of text. It is an SVG path built from the measured layout (`src/motion/trail.ts`); under reduced motion the whole line is simply there.
- **Correction.** The white shapes Ahmad saw over the What I build section were the liquid splash, not gallery cards as the previous entry guessed. The height watcher added then is kept; it is still correct to measure again when the page height changes.

## 2026-11-23 (the trail runs the whole page)

- **From the header to the footer.** Ahmad asked why the trail stopped. Two causes: the project gallery section had its own `z-index` and an opaque background, which hid the line for the whole gallery, and the tip was held at 62 percent of the screen, so the last part of the line could never be drawn. The gallery section no longer sets a `z-index`, and over the last screen of scroll the tip slides to the bottom of the screen. The wrapper now holds the hero too, so the line starts directly under the header and runs off the bottom of the page into the footer.
- **Thicker.** The line is about 31 pixels wide on a desktop gutter (it was about 17) and 9 on a phone, with a smaller wobble so it still stays inside the gutter.
