# SCENE.md: Glass Deck

The 3D world and the scroll story. Contract files win on any conflict: `DESIGN.md` (look, bans, budgets) and `ARCHITECTURE.md` section 8 (technical shape).

## Concept

A portfolio is a deck of finished work, so the hero object is a deck: one glossy card per featured project. Each card is a shallow diorama. Its face plays a ten-second motion graphic of what the project does, in a palette taken from the project's own interface, and two transparent layers float in front of it carrying the interface panels and the name. When a card is in front or under the pointer, the layers part along depth. The same scene plays on the case-study cover and the work-index preview, where the layers shift against each other with the pointer.

| Scene | Project | What plays |
| ----- | ------- | ---------- |
| 1 | MagicalBook.Store | A photo is scanned, a book writes and illustrates itself, a page turns, an order is confirmed |
| 2 | Vakse | A request for proposal goes out, three bids fly in and the best is chosen, approval steps fill, payment pulses |
| 3 | Codesmash | Two editors type side by side, tests turn green, a timer closes, the winner is crowned |
| 4 | Shocodoc | Three colored carets edit one document, a passage is highlighted, a comment thread opens |
| 5 | MenuMatch | A menu is built by dragging, a QR code resolves to a phone menu, an order ticket moves through its states |
| 6 | TaxLens | A slip is uploaded, scraper nodes pulse, a dashboard fills with bars and a two-part ring |
| 7 | Prepify | Interview cards deal in, a score ring fills, a skill radar opens |
| 8 | EchoSign | A hand shape becomes points, the points become a word, the word becomes a waveform |
| 9 | SearchX | A query is typed, index shards light up, results stack with a timing chip |
| 10 | Scrape-Stripe | A clock fires a function, tables layer up, a line chart draws |
| 11 | HundredPov | Three live stream cards pulse, the active one glows |
| 12 | Waynaa | A radar sweeps a city map, pins drop, a deal card rises |
| 13 | Xiomara | One source fans out into four language panels, one right to left |
| 14 | OrderlyFlow | A phone list scrolls, a notification lands, a chart grows |

Seven projects (MagicalBook.Store, Codesmash, Shocodoc, MenuMatch, Prepify, EchoSign, HundredPov) play over their real, edited screenshots instead: each shot sits in a browser window on the floating middle layer and slowly pushes in; the next shot wipes in through staggered slices; a scan beam passes; corner brackets and the cursor close on the region that matters, and a magnified loupe of it rises onto the top layer, tied back with connector lines. Source: `src/engine/shaders/shots.ts`.

The drawn scenes are diagrams, not screenshots, and carry no real names, people, or figures. Source: `src/engine/shaders/holo.ts` (drawing kit), `src/engine/shaders/scenes.ts` (scenes), `src/lib/palettes.ts` (palettes).

## The home story, beat by beat

1. Load: the cards fly up and settle into a deck beside the name. The name rises letter by letter and its chemistry begins.
2. Leaving the hero: the hero is about Ahmad and holds no cards (Ahmad, 2026-11-21). As the work section scrolls in, the cards rise from below the fold, tipped back and standing up as they arrive, already at gallery size.
3. Work gallery, pinned for five screens: one card at a time rests at the center beside its title, summary, and a giant index numeral. Scrolling on sends it upward and brings the next one up from below.
4. Statement: words light up as the reader scrolls through them.
5. A sideways practice track, the about block, and the closing call to action.

There is no hero zoom-out and no row of cards. Ahmad rejected both.

## Liquid splash

A fluid trail follows the pointer on every page and inverts what it covers, so the dark page shows its light negative inside the splash, with faint silk folds. The trail creeps, thins, and drains in about two seconds. A mouse press adds a larger splash; a tap makes one on touch screens. See `ARCHITECTURE.md` section 8.

## Camera

Perspective, 30 degree vertical field of view, looking at the origin from the positive z axis. Distance 11 at rest, up to 23 when the row forms (22 on portrait screens). The group tilts up to about 7 degrees toward the pointer, damped.

## Interaction

- The pointer over a card lifts it toward the viewer (raycast on pointer move only, against 5 meshes).
- Plates tilt in perspective toward the pointer, carry a sheen band that follows it, and ripple where pressed.
- Static plates bend with scroll velocity on tier 1.
- Magnetic pull on the primary button, the giant call to action, and the next-project link.
- Work index: a live plate follows the pointer and takes the relief and finish of the row under it.

## Assets

No downloaded models, textures, or HDR files.

| Asset          | Source                                            | Triangles        | Draw calls  |
| -------------- | ------------------------------------------------- | ---------------- | ----------- |
| Card           | `RoundedBoxGeometry(3.2, 2, 0.07, 5, 0.11)`       | about 2,500      | 1 each      |
| Card layers    | Two `PlaneGeometry` planes per card, shared geometry, premultiplied blending | 4 each | 2 each |
| Card art       | One pass into three render targets (ground, surfaces, lift), 768 x 480 | 0 | lead card plus one other per frame |
| Reflections    | `RoomEnvironment` prefiltered by `PMREMGenerator` | 0                | 0 per frame |
| Plate          | `PlaneGeometry(1, 1, 32, 24)`, shared             | 1,536 each       | 1 each      |
| **Worst case** | 6 cards with layers and 6 plates                  | **about 24,300** | **24**      |

## Lighting and finish

`MeshPhysicalMaterial` with a clear coat (roughness 0.14) over a body with roughness 0.32, lit only by the prefiltered studio environment. Neutral tone mapping keeps highlights from clipping. DOM-matched plates opt out of tone mapping, so their colors match CSS exactly.

## Mobile and weak devices

- Portrait: the deck sits below the copy, smaller. The row becomes a vertical cascade with a deeper pull-back.
- Tier 2: bevel 3, card art at 512 x 320, no plate bend.
- Reduced motion: one-screen hero with the first role as plain text, the work section as a plain list, no scrubbing, tilt, bend, or magnetic pull.
- No WebGL: a text-only hero, the work list with screenshots, and SVG reliefs or screenshots in every plate.

## Practice drum

"What I build" pins and turns a five-sided prism, one practice per face (CSS 3D, `drum()` in `src/motion/scenes.ts`). Scroll rolls the next face up from below and rests on each; faces turning away darken, their copy floats at three depths, and the pointer tilts the drum.
