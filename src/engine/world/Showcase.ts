import {
  CustomBlending,
  Euler,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  OneFactor,
  OneMinusSrcAlphaFactor,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection,
  type Object3D,
  type Texture,
  type WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { motion } from '../../motion/state';
import type { EngineContext, FrameInput, Tier, WorldPart } from '../types';
import { CardArt, type CardData } from './cardArt';

const { clamp, smoothstep, damp } = MathUtils;

const CARD_W = 3.2;
const CARD_H = 2.0;
const CARD_D = 0.07;
const FOV = 30;

interface Card {
  mesh: Mesh;
  material: MeshPhysicalMaterial;
  art: CardArt;
  lift: number;
  /** The two layer planes floating above the face: surfaces, then lift. */
  layers: Mesh[];
  layerMats: MeshBasicMaterial[];
  /** 0 = layers resting on the face, 1 = fully separated. */
  explode: number;
}

/** Premultiplied layer textures composite with ONE, ONE_MINUS_SRC_ALPHA. */
function layerMaterial(map: Texture): MeshBasicMaterial {
  return new MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneMinusSrcAlphaFactor,
  });
}

const LAYER_GAP = 0.24;


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
  private artCursor = 0;
  private readonly layerGeo: PlaneGeometry;

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
    const artW = tier === 1 ? 768 : 512;
    this.layerGeo = new PlaneGeometry(CARD_W * 0.985, CARD_H * 0.985);

    for (const d of Showcase.readCards()) {
      const art = new CardArt(renderer, d, artW, artW * 0.625);
      art.render(renderer, 1 + d.index);
      const material = new MeshPhysicalMaterial({
        map: art.layer(0),
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
      const layerMats = [layerMaterial(art.layer(1)), layerMaterial(art.layer(2))];
      const layers = layerMats.map((m, li) => {
        const plane = new Mesh(this.layerGeo, m);
        plane.position.z = CARD_D / 2 + 0.004 * (li + 1);
        plane.renderOrder = 1 + li;
        mesh.add(plane);
        return plane;
      });
      this.cards.push({ mesh, material, art, lift: 0, layers, layerMats, explode: 0 });
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
        // A deck tipped toward the viewer, so the top card's graphic reads; the rest peek out behind it.
        pos.set(c * 0.2, (n - 1 - i) * 0.1 - 0.15 - c * 0.12, -i * 0.12);
        rot.set(-0.62, 0.0, 0.3 + c * 0.05);
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
          // An arc facing the viewer: the middle card nearest, the ends turned in.
          pos.set(c * 3.5, 0, -Math.abs(c) * 0.55);
          rot.set(0, -c * 0.17, 0);
        }
        break;
      case 'feature':
        pos.set(0, 0.4, 0.6);
        rot.set(-0.1, -0.38, 0.05);
        break;
      default:
        // Parked far below the band: the group scrolls up with the page, so a near park would
        // drift into the content under the header.
        pos.set(c * 1.2, -40 - i, -1);
        rot.set(-1.2, 0, 0.5);
    }
  }

  /** Work gallery: cards on a spiral in depth. d is the card's distance from the front, in cards. */
  private helix(i: number, portrait: boolean): void {
    const d = i - motion.workPos;
    // One at a time: each card rises from below, faces the viewer at the center, and leaves upward.
    const gap = portrait ? 12 : 4.3;
    this.pa.set(0, -d * gap + motion.workOut * 10, -Math.abs(d) * 0.9);
    // A slight turn toward the copy; small enough that the screen stays square to the reader.
    this.ea.set(d * 0.32, -0.14, d * 0.05);
    this.qa.setFromEuler(this.ea);
    // The hero is about Ahmad and holds no cards. As the work section comes up, the cards rise
    // from below the fold into the spiral, tipped back a little and standing up as they arrive.
    const rest = 1 - smoothstep(motion.workIn, 0, 1);
    if (rest > 0) {
      this.pa.y -= rest * 9;
      this.ea.x -= rest * 0.55;
      this.qa.setFromEuler(this.ea);
    }
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
    const camTarget = 11;
    let show: boolean;

    // Gallery size comes from the viewport in pixels, so the card stays large on any screen: the
    // front card fills the right half, as large as the height allows, so its screenshot reads.
    const viewW = this.aspect * this.viewH;
    // The right margin is wider than it looks: the turn brings the right edge nearer the camera.
    const galPx = portrait ? viewW * 0.9 : Math.min(viewW * 0.5 - 100, this.viewH * 0.6 * 1.6);
    const galS = (galPx * worldPerPx) / CARD_W;
    const galX = portrait ? 0 : (viewW * 0.5 - 100 - galPx * 0.5) * worldPerPx;
    // Portrait: the card's top edge sits 150 px down, clear of the section header.
    const galY = portrait ? (this.viewH * 0.5 - 150 - galPx / 3.2) * worldPerPx : -12 * worldPerPx;

    // The home group always holds its gallery size; the cards themselves rise in (see helix).
    // Under reduced motion the gallery choreography does not run, so the list shows its screenshots.
    const gallery = motion.page === 'home' && motion.workIn > 0 && motion.workOut < 1 && !rm;
    if (motion.page === 'home') {
      gx = galX;
      gy = galY;
      gs = galS;
      show = gallery;
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

      if (motion.page === 'home') {
        // Hidden while the hero is up, but parked below the fold so the rise starts from there.
        this.helix(i, portrait);
      } else if (motion.page === 'case') {
        // A featured case keeps its own card in the head band; any other case sends the deck away.
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
      this.pa.y += card.lift * 0.12;

      mesh.position.lerp(this.pa, k);
      mesh.quaternion.slerp(this.qa, k);
      if (mesh.position.distanceToSquared(this.pa) > 1e-6 || mesh.quaternion.angleTo(this.qa) > 1e-3) this.moving = true;
      if (Math.abs(card.lift - (isHover ? 1 : 0)) > 1e-3) this.moving = true;

      // The interface lifts off the card: layers part when the card is in front or under the pointer.
      const front = gallery ? (Math.abs(i - motion.workPos) < 0.5 ? 1 : 0.15) : motion.page === 'case' && i === motion.focus ? 0.85 : 0.12;
      const exTarget = rm ? 0.15 : Math.max(front, isHover ? 1 : 0);
      card.explode = rm ? exTarget : damp(card.explode, exTarget, 4, dt);
      if (Math.abs(card.explode - exTarget) > 1e-3) this.moving = true;
      for (let li = 0; li < card.layers.length; li++) {
        card.layers[li]!.position.z = CARD_D / 2 + 0.004 * (li + 1) + card.explode * LAYER_GAP * (li + 1);
      }
    }

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

    // The card graphics play while the deck is on screen. Under reduced motion they hold one frame.
    const playing = show && !rm;
    if (playing) {
      const renderer = this.ctx.renderer;
      // The card in front redraws every frame; the rest take turns, one per frame.
      const lead = gallery ? clamp(Math.round(motion.workPos), 0, n - 1) : motion.page === 'case' && motion.focus >= 0 ? motion.focus : 0;
      this.cards[lead]!.art.render(renderer, input.time);
      this.artCursor = (this.artCursor + 1) % n;
      if (this.artCursor === lead) this.artCursor = (this.artCursor + 1) % n;
      this.cards[this.artCursor]!.art.render(renderer, input.time);
    }
    return this.moving || playing || input.pointerMoved || (motion.page === 'home' && since < 2.2);
  }

  dispose(): void {
    this.ctx.scene.remove(this.group);
    for (const c of this.cards) {
      c.material.dispose();
      for (const m of c.layerMats) m.dispose();
      c.art.dispose();
    }
    this.geometry.dispose();
    this.layerGeo.dispose();
    this.envTarget.dispose();
    this.ctx.scene.environment = null;
  }
}
