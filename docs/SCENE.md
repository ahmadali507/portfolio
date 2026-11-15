# SCENE.md: Kinetic Field

The 3D world for the site. Contract files win on any conflict: `DESIGN.md` (look, bans, budgets) and `ARCHITECTURE.md` section 8 (technical shape).

## Concept

Ahmad is an engineer who ships working systems, and this site is front-end engineering work in its own right. So the world is an instrument rather than an illustration: a field of machined pins that holds a relief, like a pin-art screen. People can touch it, and it changes shape as they move through the site.

- The home page relief is a calm swell.
- Each featured project has its own relief, and the case-study page morphs the field into it. The same relief appears on that project's cover, so a visitor connects the cover, the page, and the field.
- The canvas persists across navigation (`transition:persist`), so the morph between reliefs is the page transition.

The patterns are visual identity only. They make no claim about the projects.

| Id | Name     | Where                 | Shape                                                        |
| -- | -------- | --------------------- | ------------------------------------------------------------ |
| 0  | swell    | Home                  | Long dunes with a fine ridge across them                     |
| 1  | merge    | Shocodoc              | Two wave trains crossing into one lattice                    |
| 2  | query    | DocuChat AI           | One sharp peak with rings fading outward                     |
| 3  | sources  | Xiomara               | Three ripple origins overlapping                             |
| 4  | waveform | Voice Transfer System | A signal band that steps to a new line partway across        |
| 5  | strata   | MagicalBook.Store     | A dome cut into flat terraces, like stacked pages            |
| 6  | terrace  | Contact, other work   | Seeded noise in stepped levels                               |
| 7  | drift    | About, 404            | Seeded noise stretched into long drifts                      |
| 8  | lattice  | Work index            | A soft grid of cells                                         |

## Camera path

- Perspective camera, 32 degree vertical field of view, looking down at the field at about 34 degrees.
- On the home hero the field fills the lower 60 percent of the viewport. On wide screens the field mesh shifts right, so its mass sits beside the heading.
- Scrolling through the hero dollies the camera forward and tilts it down while field heights scale toward zero. By the end of the hero the field reads as a faint floor under the content.
- A small damped parallax follows the pointer. It is off under reduced motion.
- Other pages use the same rig with their own pattern, inside a stage band at the top of the page.

## Signature interaction

The pointer ray hits the field plane analytically. Every 0.35 world units of pointer travel adds a ripple impulse to a ring buffer of 6. Each impulse is a ring wave that travels out and decays over about 2 seconds. Pins inside a small radius around the pointer lift and take the accent color on their top faces, which is the only accent in the scene. (Lifting, not pressing: pressed tops hide behind their neighbors at this camera angle.) Touch devices get one impulse per tap instead of hover.

## Covers

Each `[data-plate]` figure gets a plane in an orthographic overlay pass, sized in CSS pixels to its DOM box.

- The fragment shader evaluates the project's height function. It shades the relief from gradients taken by finite differences, and draws hairline contours every 0.08 of height.
- Hover: a ripple from the pointer position inside the cover, and a perspective tilt of up to 6 degrees toward the pointer.
- Scroll: the plane bends along its height in proportion to Lenis velocity, clamped, and damped back to flat.

## Assets

No downloaded models or textures. Everything is procedural.

| Asset                    | Source                               | Triangles                | Draw calls |
| ------------------------ | ------------------------------------ | ------------------------ | ---------- |
| Pin                      | `BoxGeometry`, base moved to y = 0   | 12                       |            |
| Field, tier 1            | 104 x 64 = 6,656 instances           | 79,872                   | 1          |
| Field, tier 2            | 64 x 40 = 2,560 instances            | 30,720                   | 1          |
| Cover plane              | `PlaneGeometry(1, 1, 32, 24)` shared | 1,536 each               | 1 each     |
| Covers on screen, worst  | 8                                    | 12,288                   | 8          |
| **Worst case, tier 1**   |                                      | **about 92,000**         | **9**      |

Budget: under 150,000 triangles and under 80 draw calls.

## Lighting

There are no light objects and no shadow maps. The field shader computes:

- Key light from the upper left (fixed direction), Lambert term, wrapped so faces in shadow keep detail.
- Hemisphere fill: tops lighter than sides.
- Occlusion by height: the low parts of a pin read darker, so valleys gain depth.
- Distance fog toward `#E3E4E2`, so the field dissolves into the page instead of ending on a hard edge.

Output colors stay between `#E8E9E7` and `#B9BDBA`. Content text sits on solid ground where it could overlap the field.

## Mobile and weak devices

- Coarse pointer or narrow screen: tier 2 grid, pixel ratio capped at 1.5, cover bend off, and one tap ripple instead of hover ripples.
- Slow first two seconds (median frame over 22 ms): drop to tier 2. Sustained frames over the budget lower the pixel ratio step by step.
- Reduced motion: a static relief per page, instant morphs, no ripples, tilt, or bend.
- No WebGL2, save-data, `?world=off`, or a second context loss: SVG line reliefs for the poster and covers.
