/**
 * The animated pet: layered sprites (tail, ears, body, face, scarf) on a small rig.
 * Owners position and scale the rig; it animates itself from a mood, a growth
 * stage and short one-off motions.
 */
import { ColorMatrixFilter, Container, Rectangle, Sprite, type Texture } from 'pixi.js';
import { RIGS, STAGE_SHAPE, VIEW, faceForMood, type FaceKind, type Joint } from '../art/petArt';
import type { AnimalId, Mood, Stage } from '../engine/types';
import type { PetTextures } from './textures';

export type Motion = 'hop' | 'bigHop' | 'wiggle' | 'pop';

const DEG = Math.PI / 180;
const MOTION_LENGTH: Record<Motion, number> = { hop: 0.45, bigHop: 0.95, wiggle: 0.7, pop: 0.9 };

interface JointSprites { joint: Joint; sprites: Sprite[] }

function partSprite(tex: Texture, pivot?: [number, number], mirrored = false): Sprite {
  const s = new Sprite(tex);
  const k = VIEW / tex.width;
  s.scale.set(mirrored ? -k : k, k);
  if (pivot) {
    s.pivot.set(pivot[0] / k, pivot[1] / k);
    s.position.set(mirrored ? VIEW - pivot[0] : pivot[0], pivot[1]);
  }
  return s;
}

export class PetRig extends Container {
  /** Moves for hops and wiggles, rotating around the feet. */
  readonly mover = new Container();
  private readonly grower = new Container();
  private readonly bodyGroup = new Container();
  private readonly face: Sprite;
  private readonly scarf: Sprite;
  private readonly ears: JointSprites | null = null;
  private readonly frontEars: JointSprites | null = null;
  private readonly tail: { joint: Joint; sprite: Sprite } | null = null;
  private readonly fade = new ColorMatrixFilter();

  mood: Mood = 'okay';
  stage: Stage = 'baby';
  reducedMotion = false;

  private t = 0;
  private sadness = 0;
  private growth = STAGE_SHAPE.baby.scale;
  private earSize = STAGE_SHAPE.baby.ear;
  private appliedSadness = -1;
  private motion: { kind: Motion; start: number } | null = null;
  private faceOverride: { kind: FaceKind; until: number } | null = null;
  private nextBlink = 2;

  constructor(private readonly tex: PetTextures, animal: AnimalId) {
    super();
    const rig = RIGS[animal];

    this.mover.pivot.set(60, 112);
    this.addChild(this.mover);
    this.mover.addChild(this.grower);
    this.grower.pivot.set(60, 112);
    this.grower.position.set(60, 112);

    if (rig.tail && tex.tail) {
      const sprite = partSprite(tex.tail, rig.tail.pivot);
      this.tail = { joint: rig.tail, sprite };
      this.grower.addChild(sprite);
    }

    this.bodyGroup.pivot.set(60, 108);
    this.bodyGroup.position.set(60, 108);
    this.grower.addChild(this.bodyGroup);

    if (rig.ear && tex.ear) {
      const sprites = [partSprite(tex.ear, rig.ear.pivot), partSprite(tex.ear, rig.ear.pivot, true)];
      this.ears = { joint: rig.ear, sprites };
      this.bodyGroup.addChild(...sprites);
    }
    this.bodyGroup.addChild(partSprite(tex.body));
    this.face = partSprite(tex.faces.okay);
    this.bodyGroup.addChild(this.face);
    if (rig.frontEar && tex.frontEar) {
      const sprites = [partSprite(tex.frontEar, rig.frontEar.pivot), partSprite(tex.frontEar, rig.frontEar.pivot, true)];
      this.frontEars = { joint: rig.frontEar, sprites };
      this.bodyGroup.addChild(...sprites);
    }
    this.scarf = partSprite(tex.scarf);
    this.bodyGroup.addChild(this.scarf);

    this.mover.hitArea = new Rectangle(8, 10, 104, 104);
    this.filters = [this.fade];
  }

  /** Jump straight to the current mood and stage, without easing (first frame, demo jumps). */
  settle() {
    this.sadness = this.mood === 'sad' ? 1 : 0;
    this.growth = STAGE_SHAPE[this.stage].scale;
    this.earSize = STAGE_SHAPE[this.stage].ear;
    this.update(0);
  }

  play(kind: Motion, face?: FaceKind, faceSeconds = 1.2) {
    this.motion = { kind, start: this.t };
    if (face) this.showFace(face, faceSeconds);
  }

  showFace(kind: FaceKind, seconds: number) {
    this.faceOverride = { kind, until: this.t + seconds };
  }

  get busy() {
    return this.motion !== null;
  }

  update(dt: number) {
    this.t += dt;
    const t = this.t;
    const ease = Math.min(1, dt * 3);
    const shape = STAGE_SHAPE[this.stage];
    this.sadness += ((this.mood === 'sad' ? 1 : 0) - this.sadness) * ease;
    this.growth += (shape.scale - this.growth) * Math.min(1, dt * 1.6);
    this.earSize += (shape.ear - this.earSize) * ease;
    const sad = this.sadness;
    const still = this.reducedMotion ? 0 : 1;

    // Faded colors when sad
    if (Math.abs(sad - this.appliedSadness) > 0.01) {
      this.fade.reset();
      this.fade.saturate(-0.45 * sad, false);
      this.appliedSadness = sad;
    }

    // Ears and tail ease toward their droop, with a little life on top
    const energy = this.mood === 'thriving' ? 1 : this.mood === 'okay' ? 0.5 : 0.15;
    const setJoint = (j: JointSprites | null, wiggle: number) => {
      if (!j) return;
      const angle = (j.joint.rest + (j.joint.sad - j.joint.rest) * sad + wiggle) * DEG;
      const k = VIEW / j.sprites[0].texture.width;
      j.sprites.forEach((s, i) => {
        s.rotation = i === 0 ? angle : -angle;
        s.scale.set((i === 0 ? k : -k) * this.earSize, k * this.earSize);
      });
    };
    setJoint(this.ears, still * 2.5 * Math.sin(t * 1.3) * energy);
    setJoint(this.frontEars, still * 3 * Math.sin(t * 2.1) * energy);
    if (this.tail) {
      const { joint, sprite } = this.tail;
      const wag = still * (2 + 12 * energy) * Math.sin(t * Math.PI * 2 * (0.3 + 1.9 * energy));
      sprite.rotation = (joint.rest + (joint.sad - joint.rest) * sad + wag) * DEG;
    }

    // Breathing and a sad squash
    const breath = still * 0.018 * Math.sin((t * Math.PI * 2) / (2.4 + sad * 1.4));
    this.bodyGroup.scale.set(1 + 0.04 * sad - breath * 0.5, 1 - 0.1 * sad + breath);

    // Idle bob (thriving) or a slow sway (sad)
    let y = 0;
    let rot = still * sad * 1.3 * Math.sin((t * Math.PI * 2) / 5) * DEG;
    let pop = 0;
    if (this.mood === 'thriving') y -= still * 3 * Math.pow(Math.max(0, Math.sin((t * Math.PI * 2) / 1.7)), 2);

    // One-off motions
    if (this.motion) {
      const len = MOTION_LENGTH[this.motion.kind];
      const p = (t - this.motion.start) / len;
      if (p >= 1) {
        this.motion = null;
      } else {
        const hop = (q: number, h: number) => (q > 0 && q < 1 ? -h * 4 * q * (1 - q) : 0);
        switch (this.motion.kind) {
          case 'hop':
            y += hop(p, 14);
            break;
          case 'bigHop':
            y += hop(p * 2, 20) + hop(p * 2 - 1, 13);
            break;
          case 'wiggle':
            rot += 0.12 * Math.sin(p * Math.PI * 6) * (1 - p);
            break;
          case 'pop':
            pop = 0.16 * Math.sin(p * Math.PI);
            y += hop(p, 10);
            break;
        }
        if (this.reducedMotion) y = 0;
      }
    }
    this.mover.position.set(0, y);
    this.mover.rotation = rot;
    this.grower.scale.set(this.growth * (1 + pop));

    // Face: overrides, then mood with blinking
    let face: FaceKind = faceForMood(this.mood);
    if (this.faceOverride && t < this.faceOverride.until) face = this.faceOverride.kind;
    else {
      this.faceOverride = null;
      if (this.mood !== 'sad' && t > this.nextBlink) {
        face = 'blink';
        if (t > this.nextBlink + 0.14) this.nextBlink = t + 2.5 + Math.random() * 3;
      }
    }
    this.face.texture = this.tex.faces[face];
    this.scarf.visible = this.stage === 'grown';
  }
}
