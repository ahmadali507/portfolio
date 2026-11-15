# SCENE.md: Glass Deck

The 3D world and the scroll story. Contract files win on any conflict: `DESIGN.md` (look, bans, budgets) and `ARCHITECTURE.md` section 8 (technical shape).

## Concept

A portfolio is a deck of finished work, so the hero object is a deck: one glossy card per featured project, in its own finish (porcelain, vermilion, graphite, pearl, obsidian). Each face plays a motion graphic of what the project does and carries its name. The same graphic and finish appear on the case-study cover and the work-index preview.

| Scene | Shows | Used by |
| ----- | ----- | ------- |
| editor | Two people typing in one document | Shocodoc |
| ask | A document is searched; an answer points back at the passage | DocuChat AI |
| languages | One source fans out into variants, one set right to left | Xiomara |
| call | A call is checked, then routed to a person | Voice Transfer System |
| book | Pages write themselves and turn | MagicalBook.Store |
| product, phone, pipeline, spikes | Generic product kinds | The other projects |

The graphics are diagrams, not screenshots. They show no metric and imply no result. Source: `src/engine/shaders/scenes.ts`.

## The home story, beat by beat

1. Load: the cards fly up and settle into a deck beside the name. The name rises letter by letter and its chemistry begins.
2. Leaving the hero: the hero scrolls away as an ordinary first screen. The deck stays in place and opens: the top card comes forward, turns to face the viewer, and grows, while the others drop below.
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
| Card face      | Render target from the scene shader, 768 x 480, two faces refreshed per frame | 0 | 2 small passes per frame |
| Reflections    | `RoomEnvironment` prefiltered by `PMREMGenerator` | 0                | 0 per frame |
| Plate          | `PlaneGeometry(1, 1, 32, 24)`, shared             | 1,536 each       | 1 each      |
| **Worst case** | 5 cards and 6 plates                              | **about 22,000** | **11**      |

## Lighting and finish

`MeshPhysicalMaterial` with a clear coat (roughness 0.14) over a body with roughness 0.32, lit only by the prefiltered studio environment. Neutral tone mapping keeps highlights from clipping. DOM-matched plates opt out of tone mapping, so their colors match CSS exactly.

## Mobile and weak devices

- Portrait: the deck sits below the copy, smaller. The row becomes a vertical cascade with a deeper pull-back.
- Tier 2: bevel 3, card art at 512 x 320, no plate bend.
- Reduced motion: one-screen hero, deck at rest, no scrubbing, tilt, bend, or magnetic pull.
- No WebGL: CSS 3D fallback cards with SVG reliefs in the hero, and SVG reliefs in every plate.
