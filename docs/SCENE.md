# SCENE.md: Glass Deck

The 3D world and the scroll story. Contract files win on any conflict: `DESIGN.md` (look, bans, budgets) and `ARCHITECTURE.md` section 8 (technical shape).

## Concept

A portfolio is a deck of finished work, so the hero object is a deck: one glossy card per featured project. Each card carries its project's generative relief in its own finish (obsidian, porcelain, vermilion, graphite, pearl). The same relief and finish appear on that project's stacking card and case-study cover, so a visitor meets one object three times and recognizes it each time.

Reliefs and finishes are visual identity only. They make no claim about the projects.

## The home story, beat by beat

| Scroll through the hero | Deck                                                | Page                                                   |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| Load (time, once)       | Cards fly up from below and settle into a stack     | The name rises letter by letter; lead and actions fade up |
| 0 to 38 percent         | The stack opens into a fan facing the viewer        | Copy drifts up and fades                               |
| 40 to 78 percent        | The fan lines up into a row; the camera pulls back  | Nothing competes with the row                          |
| 72 to 100 percent       | The row holds                                       | The whole scene recedes into a framed window           |
| Next section rises      | The deck lifts out of the frame                     | The statement slides over; its words light up          |

Then the night chapter: full-width cards stack, each settling back, tilting, and dimming as the next slides over. Then a sideways practice track, the about block, and the closing call to action.

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
| Card face      | Render target from the pattern shader, 1024 x 640 | 0                | 0 per frame |
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
