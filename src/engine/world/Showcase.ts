import {
  Euler,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  PMREMGenerator,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection,
  type Object3D,
  type WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { motion } from '../../motion/state';
import type { EngineContext, FrameInput, Tier, WorldPart } from '../types';
import { renderCardArt } from './cardArt';

const { clamp, smoothstep, damp } = MathUtils;

const CARD_W = 3.2;
const CARD_H = 2.0;
const CARD_D = 0.07;
const FOV = 30;

interface CardData {
  slug: string;
  pattern: number;
  seed: number;
  base: string;
  line: string;
}

interface Card {
  mesh: Mesh;
  material: MeshPhysicalMaterial;
  art: WebGLRenderTarget;
  lift: number;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * The hero object: one glossy card per featured project. Poses are pure functions of page,
 * scroll progress, and time since mount; each frame damps the meshes toward them.
 */
export class Showcase implements WorldPart {
  private readonly ctx: EngineContext;
  private readonly group = new Group();
  private readonly geometry: RoundedBoxGeometry;
  private readonly cards: Card[] = [];
  private readonly envTarget: WebGLRenderTarget;
  private aspect = 1;
  private viewH = 1;
  private camZ = 11;
  private tiltX = 0;
  private tiltY = 0;
  private hovered = -1;
  private wasGallery = false;

  // Scratch, allocated once.
  private readonly pa = new Vector3();
  private readonly pb = new Vector3();
  private readonly ea = new Euler();
  private readonly eb = new Euler();
  private readonly qa = new Quaternion();
  private readonly qb = new Quaternion();
  private readonly ndc = new Vector2();
  private readonly raycaster = new Raycaster();
  private readonly hits: Intersection<Object3D>[] = [];
  private readonly meshes: Object3D[] = [];
  private moving = false;

  constructor(ctx: EngineContext, tier: Tier) {
    this.ctx = ctx;
    const { renderer, scene } = ctx;

    // A procedural studio for reflections: glossy without downloading an HDR file.
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    this.envTarget = pmrem.fromScene(room, 0.035);
    scene.environment = this.envTarget.texture;
    scene.environmentIntensity = 1.05;
    room.dispose();
    pmrem.dispose();

    // Tier 2 (weak devices): fewer bevel segments and smaller card art.
    this.geometry = new RoundedBoxGeometry(CARD_W, CARD_H, CARD_D, tier === 1 ? 5 : 3, 0.11);
    const artW = tier === 1 ? 1024 : 512;

    for (const d of Showcase.readCards()) {
      const art = renderCardArt(renderer, d.pattern, d.seed, d.base, d.line, artW, artW * 0.625);
      const material = new MeshPhysicalMaterial({
        map: art.texture,
        roughness: 0.32,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.14,
        specularIntensity: 0.6,
      });
      const mesh = new Mesh(this.geometry, material);
      mesh.position.set(0, -8, 0);
      this.group.add(mesh);
      this.meshes.push(mesh);
      this.cards.push({ mesh, material, art, lift: 0 });
    }
    scene.add(this.group);
  }

  private static readCards(): CardData[] {
    try {
      const el = document.getElementById('world-data');
      const data = el ? (JSON.parse(el.textContent ?? '{}') as { cards?: CardData[] }) : {};
      return data.cards ?? [];
    } catch {
      return [];
    }
  }

  setTier(): void {}

  resize(width: number, height: number): void {
    this.aspect = width / Math.max(1, height);
    this.viewH = height;
    this.ctx.camera.fov = FOV;
    this.ctx.camera.updateProjectionMatrix();
  }

  mount(): void {
    this.ctx.invalidate();
  }

  unmount(): void {}

  /** Writes the pose of card i for a named arrangement into pos and rot. */
  private pose(kind: 'enter' | 'stack' | 'fan' | 'row' | 'away' | 'feature', i: number, pos: Vector3, rot: Euler): void {
    const n = Math.max(1, this.cards.length);
    const c = i - (n - 1) / 2;
    const portrait = this.aspect < 0.9;
    switch (kind) {
      case 'enter':
        pos.set(c * 0.8, -7 - i * 0.6, 2);
        rot.set(-1.4, 0.3, 0.6 - i * 0.2);
        break;
      case 'stack':
        // A neat deck seen at three quarters: the top card is the first project.
        pos.set(c * 0.07, (n - 1 - i) * 0.11 - 0.2, c * 0.04);
        rot.set(-1.08, 0, 0.42 + c * 0.035);
        break;
      case 'fan': {
        const a = c * (portrait ? 0.2 : 0.24);
        pos.set(Math.sin(a) * 3.6, Math.cos(a) * 1.4 - 1.3, -Math.abs(c) * 0.25 + i * 0.01);
        rot.set(-0.08, a * 0.35, -a);
        break;
      }
      case 'row':
        if (portrait) {
          pos.set(0, -c * 2.35, -Math.abs(c) * 0.4);
          rot.set(0, 0, 0);
        } else {
          pos.set(c * 3.55, Math.sin(c * 0.9) * 0.15, -Math.abs(c) * 0.3);
          rot.set(0, -c * 0.06, 0);
        }
        break;
      case 'feature':
        pos.set(0, 0.4, 0.6);
        rot.set(-0.1, -0.38, 0.05);
        break;
      default:
        pos.set(c * 1.2, -9 - i, -1);
        rot.set(-1.2, 0, 0.5);
    }
  }

  /** Work gallery: cards on a spiral in depth. d is the card's distance from the front, in cards. */
  private helix(i: number, portrait: boolean): void {
    const d = i - motion.workPos;
    // A wheel turning toward the viewer: the next card waits below, the last one tips away above.
    const a = d * 0.6;
    const r = portrait ? 5.2 : 5.4;
    // Rises from below as the section arrives, lifts away as it leaves.
    const travel = (1 - motion.workIn) * -9 + motion.workOut * 10;
    this.pa.set(d * 0.3, -Math.sin(a) * r + travel * (1 + Math.abs(d) * 0.15), Math.cos(a) * r - r);
    this.ea.set(a * 1.05, -0.3 + d * 0.1, d * 0.04);
    this.qa.setFromEuler(this.ea);
  }

  private blend(i: number, a: 'enter' | 'stack' | 'fan' | 'row' | 'away' | 'feature', b: typeof a, t: number): void {
    this.pose(a, i, this.pa, this.ea);
    this.pose(b, i, this.pb, this.eb);
    this.pa.lerp(this.pb, t);
    this.qa.setFromEuler(this.ea);
    this.qb.setFromEuler(this.eb);
    this.qa.slerp(this.qb, t);
  }

  update(input: FrameInput): boolean {
    const n = this.cards.length;
    if (!n) return false;
    const rm = input.reducedMotion;
    const dt = input.dt;
    const since = input.time - motion.mountedAt;
    const portrait = this.aspect < 0.9;
    const visibleH = 2 * Math.tan(MathUtils.degToRad(FOV / 2)) * 11;
    const worldPerPx = visibleH / Math.max(1, this.viewH);

    // ---- page layout of the whole group ----
    let gx: number;
    let gy: number;
    let gs: number;
    let camTarget = 11;
    let show: boolean;
    const p = motion.hero;
    const toFan = smoothstep(p, 0.02, 0.38);
    const toRow = smoothstep(p, 0.4, 0.74);

    const gallery = motion.page === 'home' && motion.workIn > 0 && motion.workOut < 1;
    if (gallery) {
      gx = portrait ? 0 : 2.5;
      gy = portrait ? 1.5 : 0;
      gs = portrait ? 0.5 : 1.05;
      show = true;
    } else if (motion.page === 'home') {
      gx = portrait ? 0 : MathUtils.lerp(3.05, 0, toRow);
      gy = (portrait ? MathUtils.lerp(-1.75, 0, toRow) : -0.1) + motion.exit * 9;
      gs = portrait ? MathUtils.lerp(0.68, 0.62, toRow) : MathUtils.lerp(0.78, 1, toRow);
      // The camera pulls back as the cards line up, so the whole row fits before the frame closes in.
      camTarget = 11 + (portrait ? 11 : 12) * smoothstep(p, 0.32, 0.78);
      show = !motion.heroCovered;
    } else {
      // Banner pages: the group sits in the head band and scrolls away with it.
      const feature = motion.page === 'case' && motion.focus >= 0;
      gx = portrait ? 0 : feature ? 2.75 : 2.55;
      gy = (portrait ? 1.35 : 0.35) + input.scroll * worldPerPx;
      gs = portrait ? 0.55 : feature ? 0.72 : 0.5;
      show = input.scroll < this.viewH * 1.1;
    }
    this.group.visible = show;

    // ---- pointer: group tilt and hovered card ----
    const pointerOn = !rm && input.pointerInside && show;
    this.tiltX = rm ? 0 : damp(this.tiltX, pointerOn ? -input.pointerY * 0.12 : 0, 3, dt);
    this.tiltY = rm ? 0 : damp(this.tiltY, pointerOn ? input.pointerX * 0.2 : 0, 3, dt);
    if (input.pointerMoved && pointerOn) {
      this.ndc.set(input.pointerX, input.pointerY);
      this.raycaster.setFromCamera(this.ndc, this.ctx.camera);
      this.hits.length = 0;
      this.raycaster.intersectObjects(this.meshes, false, this.hits);
      this.hovered = this.hits.length ? this.meshes.indexOf(this.hits[0]!.object) : -1;
    } else if (!pointerOn) {
      this.hovered = -1;
    }
    const domHover = motion.hover;

    this.moving = false;
    const k = rm ? 1 : 1 - Math.exp(-6 * dt);

    for (let i = 0; i < n; i++) {
      const card = this.cards[i]!;
      const mesh = card.mesh;

      if (gallery) {
        this.helix(i, portrait);
      } else if (motion.page === 'home') {
        const intro = rm ? 1 : easeOutExpo(clamp((since - 0.2 - i * 0.09) / 1.4, 0, 1));
        if (toRow > 0) this.blend(i, 'fan', 'row', toRow);
        else this.blend(i, 'stack', 'fan', toFan);
        if (intro < 1) {
          this.pose('enter', i, this.pb, this.eb);
          this.qb.setFromEuler(this.eb);
          this.pa.lerp(this.pb, 1 - intro);
          this.qa.slerp(this.qb, 1 - intro);
        }
      } else if (motion.page === 'case' && motion.focus >= 0) {
        if (i === motion.focus) this.blend(i, 'feature', 'feature', 0);
        else this.blend(i, 'away', 'away', 0);
      } else if (motion.page === 'work') {
        this.blend(i, 'fan', 'fan', 0);
      } else {
        this.blend(i, 'stack', 'stack', 0);
      }

      // Hover lifts a card toward the viewer.
      const isHover = i === this.hovered || i === domHover;
      card.lift = rm ? 0 : damp(card.lift, isHover ? 1 : 0, 8, dt);
      this.pa.z += card.lift * 0.45;
      this.pa.y += card.lift * (motion.page === 'home' && toFan < 0.5 ? 0.25 : 0.12);

      if (gallery !== this.wasGallery) mesh.position.copy(this.pa);
      mesh.position.lerp(this.pa, k);
      mesh.quaternion.slerp(this.qa, k);
      if (mesh.position.distanceToSquared(this.pa) > 1e-6 || mesh.quaternion.angleTo(this.qa) > 1e-3) this.moving = true;
      if (Math.abs(card.lift - (isHover ? 1 : 0)) > 1e-3) this.moving = true;
    }

    this.wasGallery = gallery;
    const g = this.group;
    const gk = rm ? 1 : 1 - Math.exp(-5 * dt);
    g.position.x += (gx - g.position.x) * gk;
    g.position.y += (gy - g.position.y) * gk;
    const sNext = g.scale.x + (gs - g.scale.x) * gk;
    g.scale.setScalar(sNext);
    g.rotation.set(this.tiltX, this.tiltY, 0);
    if (Math.abs(g.position.x - gx) > 1e-3 || Math.abs(g.position.y - gy) > 1e-3 || Math.abs(sNext - gs) > 1e-3) this.moving = true;

    this.camZ = rm ? camTarget : damp(this.camZ, camTarget, 4, dt);
    if (Math.abs(this.camZ - camTarget) > 1e-3) this.moving = true;
    const cam = this.ctx.camera;
    cam.position.set(0, 0, this.camZ);
    cam.lookAt(0, 0, 0);

    return this.moving || input.pointerMoved || (motion.page === 'home' && since < 2.2);
  }

  dispose(): void {
    this.ctx.scene.remove(this.group);
    for (const c of this.cards) {
      c.material.dispose();
      c.art.dispose();
    }
    this.geometry.dispose();
    this.envTarget.dispose();
    this.ctx.scene.environment = null;
  }
}
