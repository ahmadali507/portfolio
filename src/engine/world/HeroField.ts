import {
  BoxGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  Path,
  Shape,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { motion } from '../../motion/state';
import { HeroGrid } from './HeroGrid';
import type { EngineContext, FrameInput, Tier, WorldPart } from '../types';

/**
 * The home hero's 3D: one object at a time, floating beside the name on a grid of cells. There is
 * one object per role in the typed line (code brackets, a chip, a phone, a cloud, a laptop, a
 * gear), modelled from simple solids in physical materials and lit by the room environment the
 * Showcase installs. When the typed role changes, the object on screen shrinks away with a turn
 * and the next one grows in its place. It turns slowly and leans toward the pointer.
 *
 * The world canvas normally sits above the page. While the hero is in view this part lowers it
 * beneath the page content (the hero has no background of its own), and raises it again as the work
 * section arrives and the object has sunk away. Holds still under reduced motion.
 */

const CAM_Z = 11;
const ROLE_COUNT = 6;

interface Item {
  obj: Group;
  /** Rest position: x and y as fractions of the visible half extents at that depth, z in world units. */
  fx: number;
  fy: number;
  z: number;
  size: number;
  rest: Euler;
  phase: number;
  /** Continuous spin around local z, radians per second (the gear). */
  spin: number;
  lift: number;
  appear: number;
}

// Placement: [fx, fy, z, size]. Wide screens put the object in the right half, beside the copy.
const WIDE: Array<[number, number, number, number]> = [
  [0.5, 0.02, -0.6, 2.3], // code
  [0.5, 0.02, -0.6, 2.2], // chip
  [0.5, 0.02, -0.6, 2.3], // phone
  [0.5, 0.02, -0.6, 2.9], // cloud
  [0.5, 0.0, -0.6, 2.4], // laptop
  [0.5, 0.02, -0.6, 2.4], // gear
];
// Tall screens: the object sits in the band between the header and the name.
const TALL: Array<[number, number, number, number]> = [
  [0, 0.6, -1, 0.85],
  [0, 0.6, -1, 0.8],
  [0, 0.6, -1, 0.85],
  [0, 0.6, -1, 1.0],
  [0, 0.6, -1, 0.85],
  [0, 0.6, -1, 0.88],
];

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
const backOut = (t: number) => {
  const x = Math.min(1, Math.max(0, t)) - 1;
  return 1 + 2.2 * x * x * x + 1.2 * x * x;
};
const damp = (a: number, b: number, l: number, dt: number) => a + (b - a) * (1 - Math.exp(-l * dt));

export class HeroField implements WorldPart {
  private readonly ctx: EngineContext;
  private readonly group = new Group();
  private readonly items: Item[] = [];
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private host: HTMLElement | null = null;
  private under = false;
  private aspect = 1;
  private viewH = 1;
  private tiltX = 0;
  private tiltY = 0;
  private hide = 1;
  private wasShown = false;
  private compiled = false;
  private readyAt = -1;
  /** True on tall screens, where the object sits above the name and not beside it. */
  private solo = false;
  private readonly v = new Vector3();
  private readonly grid: HeroGrid;
  private hero: HTMLElement | null = null;
  private viewW = 1;
  private gridOn = false;

  constructor(ctx: EngineContext, tier: Tier) {
    this.ctx = ctx;
    const seg = tier === 1 ? 4 : 2;

    const ceramic = this.mat(new MeshPhysicalMaterial({ color: '#ebe9e4', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06 }));
    const graphite = this.mat(
      new MeshPhysicalMaterial({ color: '#1a1c1f', roughness: 0.22, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.04 }),
    );
    const steel = this.mat(new MeshPhysicalMaterial({ color: '#c8ccd1', metalness: 1, roughness: 0.26 }));
    const gold = this.mat(new MeshPhysicalMaterial({ color: '#d2a04a', metalness: 1, roughness: 0.2 }));
    const accent = this.mat(new MeshPhysicalMaterial({ color: '#4c6fff', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05 }));
    const screen = this.mat(
      new MeshPhysicalMaterial({ color: '#0c1520', emissive: '#0f2233', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 }),
    );
    const ui = this.mat(new MeshPhysicalMaterial({ color: '#3a4652', emissive: '#1c2733', roughness: 0.4 }));
    const pearl = this.mat(
      new MeshPhysicalMaterial({
        color: '#f1f0ec',
        roughness: 0.45,
        sheen: 1,
        sheenRoughness: 0.5,
        sheenColor: '#ffffff',
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
      }),
    );

    const bar = this.geo(new RoundedBoxGeometry(1, 0.17, 0.17, seg, 0.07));
    const builders: Array<() => Group> = [
      // 0 Software Engineer: a code glyph, the slash in the accent.
      () => {
        const g = new Group();
        const strokes: Array<[number, number, number, number, Material]> = [
          [-0.55, 0.165, 0.52, 0.69, ceramic],
          [-0.55, -0.165, 0.52, -0.69, ceramic],
          [0.55, 0.165, 0.52, -0.69, ceramic],
          [0.55, -0.165, 0.52, 0.69, ceramic],
          [0, 0, 0.9, 1.23, accent],
        ];
        for (const [x, y, len, ang, m] of strokes) {
          const s = new Mesh(bar, m);
          s.position.set(x, y, 0);
          s.rotation.z = ang;
          s.scale.x = len;
          g.add(s);
        }
        return g;
      },
      // 1 AI & LLM Engineer: a chip with gold pins.
      () => {
        const g = new Group();
        g.add(new Mesh(this.geo(new RoundedBoxGeometry(1, 1, 0.14, seg, 0.06)), graphite));
        const die = new Mesh(this.geo(new RoundedBoxGeometry(0.56, 0.56, 0.05, 2, 0.02)), steel);
        die.position.z = 0.08;
        g.add(die);
        const per = 6;
        const pins = new InstancedMesh(this.geo(new BoxGeometry(0.07, 0.17, 0.035)), gold, per * 4);
        const m4 = new Matrix4();
        let k = 0;
        for (let side = 0; side < 4; side++) {
          for (let i = 0; i < per; i++) {
            const t = (i - (per - 1) / 2) * 0.14;
            const a = (side * Math.PI) / 2;
            const x = Math.cos(a) * 0.56 - Math.sin(a) * t;
            const y = Math.sin(a) * 0.56 + Math.cos(a) * t;
            m4.makeRotationZ(a + Math.PI / 2);
            m4.setPosition(x, y, 0);
            pins.setMatrixAt(k++, m4);
          }
        }
        g.add(pins);
        return g;
      },
      // 2 Web & Mobile App Developer: a phone with a lit interface.
      () => {
        const g = new Group();
        g.add(new Mesh(this.geo(new RoundedBoxGeometry(0.62, 1.24, 0.08, seg, 0.09)), graphite));
        const sc = new Mesh(this.geo(new RoundedBoxGeometry(0.55, 1.14, 0.012, 2, 0.06)), screen);
        sc.position.z = 0.042;
        g.add(sc);
        const rows: Array<[number, number, number, Material]> = [
          [0, 0.36, 0.42, ui],
          [-0.06, 0.24, 0.3, ui],
          [0, -0.02, 0.42, ui],
          [0, -0.38, 0.42, accent],
        ];
        const row = this.geo(new RoundedBoxGeometry(1, 0.07, 0.01, 1, 0.02));
        for (const [x, y, w, m] of rows) {
          const r = new Mesh(row, m);
          r.position.set(x, y, 0.05);
          r.scale.x = w;
          g.add(r);
        }
        return g;
      },
      // 3 Cloud Solutions Architect: a soft cloud.
      () => {
        const g = new Group();
        const ball = this.geo(new SphereGeometry(1, 40, 28));
        const puffs: Array<[number, number, number, number]> = [
          [0, 0.02, 0, 0.42],
          [-0.42, -0.1, 0.02, 0.3],
          [0.43, -0.08, 0.02, 0.32],
          [0.17, 0.26, -0.05, 0.3],
          [-0.2, 0.2, -0.06, 0.26],
        ];
        for (const [x, y, z, r] of puffs) {
          const p = new Mesh(ball, pearl);
          p.position.set(x, y, z);
          p.scale.set(r, r * 0.92, r);
          g.add(p);
        }
        return g;
      },
      // 4 Full-Stack SaaS Developer: an open laptop.
      () => {
        const g = new Group();
        const base = new Mesh(this.geo(new RoundedBoxGeometry(1.3, 0.06, 0.88, seg, 0.03)), steel);
        g.add(base);
        const keys = new Mesh(this.geo(new RoundedBoxGeometry(1.1, 0.012, 0.42, 1, 0.01)), graphite);
        keys.position.set(0, 0.034, -0.12);
        g.add(keys);
        const hinge = new Group();
        hinge.position.set(0, 0.03, -0.44);
        hinge.rotation.x = -0.32;
        const lid = new Mesh(this.geo(new RoundedBoxGeometry(1.3, 0.84, 0.045, seg, 0.03)), steel);
        lid.position.set(0, 0.42, 0);
        hinge.add(lid);
        const disp = new Mesh(this.geo(new RoundedBoxGeometry(1.2, 0.74, 0.01, 1, 0.02)), screen);
        disp.position.set(0, 0.42, 0.026);
        hinge.add(disp);
        const strip = new Mesh(this.geo(new RoundedBoxGeometry(0.7, 0.05, 0.01, 1, 0.02)), accent);
        strip.position.set(-0.18, 0.62, 0.034);
        hinge.add(strip);
        g.add(hinge);
        g.rotation.x = 0.35;
        return g;
      },
      // 5 Automation Engineer: a machined gear that keeps turning.
      () => {
        const teeth = 11;
        const ro = 0.56;
        const ri = 0.45;
        const shape = new Shape();
        for (let i = 0; i < teeth; i++) {
          const a0 = (i / teeth) * Math.PI * 2;
          const w = (Math.PI * 2) / teeth;
          const pts: Array<[number, number]> = [
            [ri, a0],
            [ro, a0 + w * 0.12],
            [ro, a0 + w * 0.42],
            [ri, a0 + w * 0.54],
          ];
          for (let j = 0; j < pts.length; j++) {
            const [r, a] = pts[j]!;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0 && j === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
          }
        }
        const hole = new Path();
        hole.absarc(0, 0, 0.16, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        const geo = this.geo(
          new ExtrudeGeometry(shape, {
            depth: 0.16,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.025,
            bevelSegments: seg,
            curveSegments: 24,
          }),
        );
        geo.center();
        const g = new Group();
        g.add(new Mesh(geo, steel));
        const hub = new Mesh(this.geo(new CylinderGeometry(0.24, 0.24, 0.2, 32, 1)), graphite);
        hub.rotation.x = Math.PI / 2;
        g.add(hub);
        return g;
      },
    ];

    const rests: Array<[number, number, number]> = [
      [0.05, 0, 0],
      [0.12, 0, 0],
      [0.05, 0, 0],
      [0.05, 0, 0],
      [0.4, 0, 0],
      [0.1, 0, 0],
    ];
    for (let i = 0; i < ROLE_COUNT; i++) {
      const obj = builders[i]!();
      const r = rests[i]!;
      this.items.push({
        obj,
        fx: 0,
        fy: 0,
        z: 0,
        size: 1,
        rest: new Euler(r[0], r[1], r[2]),
        phase: i * 1.37,
        spin: i === 5 ? 0.35 : 0,
        lift: 0,
        appear: 0,
      });
      this.group.add(obj);
    }
    this.grid = new HeroGrid('#4c6fff');
    ctx.scene.add(this.grid.mesh);
    this.group.visible = false;
    ctx.scene.add(this.group);
    // Compile the programs off the main thread where the GPU allows it, so the first hero frames do
    // not stall the typed line; the objects rise in once they are ready.
    ctx.renderer
      .compileAsync(this.group, ctx.camera, ctx.scene)
      .then(() => {
        this.compiled = true;
        ctx.invalidate();
      })
      .catch(() => {
        this.compiled = true;
      });
  }

  private mat<T extends Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  private geo<T extends BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  setTier(): void {}

  resize(width: number, height: number): void {
    this.aspect = width / Math.max(1, height);
    this.viewW = width;
    this.viewH = height;
    this.grid.resize(width, height, this.ctx.renderer.getPixelRatio());
    this.solo = this.aspect < 0.9;
    const layout = this.solo ? TALL : WIDE;
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i]!;
      const p = layout[i]!;
      it.fx = p[0];
      it.fy = p[1];
      it.z = p[2];
      it.size = p[3];
    }
  }

  mount(doc: Document): void {
    this.host = doc.getElementById('world');
    this.hero = doc.querySelector<HTMLElement>('[data-hero]');
    this.ctx.invalidate();
  }

  unmount(): void {
    this.hero = null;
    this.grid.mesh.visible = false;
    this.setUnder(false);
  }

  private setUnder(on: boolean): void {
    if (on === this.under) return;
    this.under = on;
    if (!this.host) return;
    if (on) this.host.dataset.under = '';
    else delete this.host.dataset.under;
  }

  update(input: FrameInput): boolean {
    const rm = input.reducedMotion;
    const dt = input.dt;
    const t = input.time;
    const home = motion.page === 'home';
    // Sink the object away as the work section rises, then hand the canvas back above the page.
    const goal = home ? smooth((motion.workIn - 0.12) / 0.3) : 1;
    this.hide = rm ? goal : damp(this.hide, goal, 6, dt);
    if (this.compiled && this.readyAt < 0) this.readyAt = t;
    const under = home && motion.workIn < 0.45;
    this.setUnder(under);

    // The grid belongs to the hero, and shows only while the canvas sits beneath the page.
    const heroH = this.hero ? this.hero.offsetHeight : this.viewH;
    const gridOn = under && input.scroll < heroH;
    this.grid.mesh.visible = gridOn;
    if (gridOn) {
      const inside = !rm && input.pointerInside;
      this.grid.update(
        t,
        input.scroll,
        heroH,
        1,
        rm ? 99 : t - motion.mountedAt,
        rm,
        inside ? (input.pointerX * 0.5 + 0.5) * this.viewW : -1,
        inside ? (0.5 - input.pointerY * 0.5) * this.viewH : -1,
      );
    }
    const gridChanged = gridOn !== this.gridOn;
    this.gridOn = gridOn;

    const shown = home && this.compiled && this.hide < 0.999 && input.scroll < this.viewH * 1.4;
    this.group.visible = shown;
    if (!shown) {
      const changed = this.wasShown || gridChanged;
      this.wasShown = false;
      return changed || gridOn;
    }
    this.wasShown = true;

    const tanH = Math.tan(MathUtils.degToRad(this.ctx.camera.fov / 2));
    const worldPerPx = (2 * tanH * CAM_Z) / Math.max(1, this.viewH);
    // Rise in after the page mounts and the programs are ready, whichever is later.
    const since = t - Math.max(motion.mountedAt, this.readyAt);
    const appear = rm ? 1 : backOut((since - 0.3) / 1.2);
    const pointerOn = !rm && input.pointerInside;
    this.tiltX = rm ? 0 : damp(this.tiltX, pointerOn ? -input.pointerY * 0.26 : 0, 3, dt);
    this.tiltY = rm ? 0 : damp(this.tiltY, pointerOn ? input.pointerX * 0.42 : 0, 3, dt);
    this.group.rotation.set(0, 0, 0);
    // The object leaves a little slower than the page, so it reads as hanging in front of the grid.
    this.group.position.y = input.scroll * worldPerPx * 0.82;

    const sink = this.hide;
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i]!;
      const o = it.obj;
      const active = i === motion.role ? 1 : 0;
      it.lift = rm ? active : damp(it.lift, active, 5, dt);
      // The outgoing object shrinks away before the next one grows in its place.
      const show = smooth(Math.max(0, it.lift * 2 - 1));

      const depth = it.z - sink * 3;
      const halfH = (CAM_Z - depth) * tanH;
      const bob = rm ? 0 : Math.sin(t * 0.8 + it.phase) * 0.1;
      this.v.set(it.fx * halfH * this.aspect, it.fy * halfH + bob - sink * 1.5, depth);
      o.position.copy(this.v);

      const sway = rm ? 0 : Math.sin(t * 0.32 + it.phase) * 0.16;
      o.rotation.set(
        it.rest.x + this.tiltX + (rm ? 0 : Math.sin(t * 0.5 + it.phase) * 0.05),
        -0.38 + this.tiltY + sway + (1 - show) * -1.4,
        it.spin && !rm ? t * it.spin : 0,
      );
      const s = it.size * Math.max(0.0001, appear * show) * (1 - sink * 0.6);
      o.visible = s > 0.002;
      o.scale.setScalar(s);
    }
    return true;
  }

  dispose(): void {
    this.setUnder(false);
    this.grid.dispose();
    this.ctx.scene.remove(this.group);
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    this.geometries.length = 0;
    this.materials.length = 0;
  }
}
