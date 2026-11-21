// Shared motion state. Written by DOM choreography (ScrollTrigger callbacks, pointer events),
// read by the 3D engine every frame. Plain numbers only, so reading it costs nothing and
// the 3D and the DOM can never disagree about where the story is.

export type PageKind = 'home' | 'work' | 'case' | 'about' | 'contact' | 'missing';

export const motion = {
  page: 'home' as PageKind,
  /** 0..1 progress through the pinned home hero. */
  hero: 0,
  /** 0..1 while the section after the hero rises over it; the 3D stack lifts away with it. */
  exit: 0,
  /** True once the next section fully covers the hero, so the 3D stack can rest. */
  heroCovered: false,
  /** Work gallery: 0..1 while it rises into place, position in cards (0..n-1), 0..1 while it leaves. */
  workIn: 0,
  workPos: 0,
  workOut: 0,
  /** Home hero: index into ROLES of the role being typed, so the 3D object for it comes forward. */
  role: 0,
  /**
   * Home hero: the last key the typed line struck ('\b' for the clear), and a counter that rises
   * with every stroke, so the keyboard under the hero presses the same key.
   */
  key: '',
  keySeq: 0,
  /** Featured card index a case-study page is about, or -1. */
  focus: -1,
  /** Featured card index under the pointer in the DOM (rows, stack cards), or -1. */
  hover: -1,
  /** Lenis scroll offset and velocity, mirrored each tick. */
  scroll: 0,
  velocity: 0,
  reduced: false,
  /** Seconds since the current page mounted, for entrance timing. */
  mountedAt: 0,
};
