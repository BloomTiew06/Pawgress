/**
 * The pet's home on the Today screen: a PixiJS canvas with the rig, a watercolor
 * wash, boiling ink lines, particles and toys.
 *
 * React talks to it only through `PetView` (what to show), `react()` / `playToy()`
 * (one-off moments) and the `onPet` callback. It never reads the store.
 */
import {
  Application, BlurFilter, Container, DisplacementFilter, Graphics, Sprite, type Texture,
} from 'pixi.js';
import { PALETTES } from '../art/petArt';
import type { PropId } from '../art/props';
import type { AnimalId, Mood, ReactionKind, Stage } from '../engine/types';
import { PetRig } from './PetRig';
import { loadPetTextures, loadProps, noiseTexture } from './textures';

export interface PetView {
  animal: AnimalId;
  mood: Mood;
  stage: Stage;
}

export type ToyId = 'ball' | 'bubbles';

interface Actor {
  /** Advance by dt seconds. Return false when finished. */
  step(dt: number): boolean;
  node: Container;
}

const PROP_IDS: PropId[] = ['heart', 'sparkle', 'ball', 'bubble'];

export class PetStage {
  private app!: Application;
  private world = new Container();
  private petLayer = new Container();
  private fx = new Container();
  private wash = new Graphics();
  private shadow = new Graphics();
  private rig: PetRig | null = null;
  private props!: Record<PropId, Texture>;
  private boil!: DisplacementFilter;
  private boilSprite!: Sprite;
  private boilClock = 0;
  private actors: Actor[] = [];
  private view: PetView;
  private petListeners = new Set<() => void>();
  private destroyed = false;
  private loading: Promise<void> | null = null;

  private constructor(view: PetView, private reducedMotion: boolean) {
    this.view = view;
  }

  static async create(host: HTMLElement, view: PetView, opts: { reducedMotion: boolean }): Promise<PetStage> {
    const stage = new PetStage(view, opts.reducedMotion);
    await stage.init(host);
    return stage;
  }

  private async init(host: HTMLElement) {
    const app = new Application();
    await app.init({
      backgroundAlpha: 0,
      resizeTo: host,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.app = app;
    host.appendChild(app.canvas);
    app.canvas.setAttribute('aria-hidden', 'true');

    this.props = await loadProps(PROP_IDS);

    // Boiling ink: a noise map nudged a few times a second, like redrawn animation frames.
    this.boilSprite = new Sprite(noiseTexture());
    this.boilSprite.alpha = 0;
    this.boilSprite.scale.set(3);
    this.boil = new DisplacementFilter({ sprite: this.boilSprite, scale: 5 });

    this.wash.filters = [new BlurFilter({ strength: 14, quality: 3 })];
    this.petLayer.filters = [this.boil];
    this.world.addChild(this.shadow, this.wash, this.petLayer, this.fx);
    app.stage.addChild(this.boilSprite, this.world);

    await this.buildRig();
    this.layout();
    app.renderer.on('resize', () => this.layout());
    app.ticker.add((ticker) => this.tick(ticker.deltaMS / 1000));
  }

  private async buildRig() {
    const animal = this.view.animal;
    const tex = await loadPetTextures(animal);
    if (this.destroyed || animal !== this.view.animal) return;
    if (this.rig) this.rig.destroy({ children: true });
    const rig = new PetRig(tex, animal);
    rig.mood = this.view.mood;
    rig.stage = this.view.stage;
    rig.reducedMotion = this.reducedMotion;
    rig.settle();
    rig.mover.eventMode = 'static';
    rig.mover.cursor = 'pointer';
    rig.mover.on('pointertap', () => this.petListeners.forEach((fn) => fn()));
    this.rig = rig;
    this.petLayer.addChild(rig);
    this.drawWash();
    this.layout();
  }

  /** Show a different animal, mood or stage. Mood and stage changes ease in. */
  update(view: PetView) {
    const animalChanged = view.animal !== this.view.animal;
    this.view = view;
    if (animalChanged) {
      this.loading = this.buildRig();
      return;
    }
    if (!this.rig) return;
    this.rig.mood = view.mood;
    this.rig.stage = view.stage;
    this.drawWash();
  }

  onPet(fn: () => void) {
    this.petListeners.add(fn);
    return () => this.petListeners.delete(fn);
  }

  react(kind: ReactionKind) {
    const rig = this.rig;
    if (!rig) return;
    switch (kind) {
      case 'habitTap':
        rig.play('hop', 'happy', 0.6);
        this.burst('sparkle', 1);
        break;
      case 'habitDone':
        rig.play('bigHop', 'joy', 1.2);
        this.burst('sparkle', 4);
        break;
      case 'dayDone':
        rig.play('bigHop', 'joy', 2.2);
        this.burst('sparkle', 9);
        this.burst('heart', 3);
        break;
      case 'welcomeBack':
        rig.play('bigHop', 'joy', 2.2);
        this.burst('heart', 6);
        break;
      case 'stageUp':
        rig.play('pop', 'joy', 2.4);
        this.burst('sparkle', 12);
        break;
      case 'petted':
        rig.play('wiggle', 'joy', 1);
        this.burst('heart', 2);
        break;
      case 'gameEnd':
      case 'greetThriving':
        rig.play('hop', 'happy', 0.8);
        break;
      default:
        break;
    }
  }

  playToy(toy: ToyId) {
    if (!this.rig) return;
    if (toy === 'ball') this.throwBall();
    else this.blowBubbles();
  }

  destroy() {
    this.destroyed = true;
    this.petListeners.clear();
    const finish = () => this.app?.destroy({ removeView: true }, { children: true });
    if (this.loading) this.loading.finally(finish);
    else finish();
  }

  // ---------- internals ----------

  private get unit() {
    const { width, height } = this.app.screen;
    return Math.min(width / 150, height / 158);
  }

  private get feet() {
    const { width, height } = this.app.screen;
    return { x: width / 2, y: height * 0.92 };
  }

  private layout() {
    if (!this.app?.renderer) return;
    const u = this.unit;
    const { x, y } = this.feet;
    if (this.rig) {
      this.rig.position.set(x, y);
      this.rig.scale.set(u);
    }
    this.shadow.clear().ellipse(x, y + u, 38 * u, 4.5 * u).fill({ color: 0x26344f, alpha: 0.08 });
    this.drawWash();
  }

  private drawWash() {
    if (!this.app?.renderer) return;
    const u = this.unit;
    const { x, y } = this.feet;
    const color = PALETTES[this.view.animal].tint;
    const sad = this.view.mood === 'sad';
    this.wash
      .clear()
      .ellipse(x + 4 * u, y - 34 * u, 56 * u, 40 * u)
      .fill({ color, alpha: sad ? 0.3 : 0.55 });
  }

  private tick(dt: number) {
    if (this.destroyed) return;
    this.rig?.update(dt);
    this.boilClock += dt;
    if (!this.reducedMotion && this.boilClock > 0.13) {
      this.boilClock = 0;
      this.boilSprite.position.set(-Math.random() * 300, -Math.random() * 300);
    }
    this.actors = this.actors.filter((a) => {
      const alive = a.step(dt);
      if (!alive) a.node.destroy();
      return alive;
    });
  }

  private addActor(node: Container, step: (dt: number) => boolean) {
    this.fx.addChild(node);
    this.actors.push({ node, step });
  }

  /** Little hearts or sparkles drifting up from the pet. */
  private burst(prop: PropId, count: number) {
    const u = this.unit;
    const { x, y } = this.feet;
    const size = u;
    for (let i = 0; i < count; i++) {
      const s = new Sprite(this.props[prop]);
      s.anchor.set(0.5);
      const scale = (0.13 + Math.random() * 0.09) * size;
      s.scale.set(scale);
      s.position.set(x + (Math.random() - 0.5) * 80 * u, y - (60 + Math.random() * 40) * u);
      const vx = (Math.random() - 0.5) * 30 * u;
      const vy = -(30 + Math.random() * 40) * u;
      const spin = (Math.random() - 0.5) * 2;
      let life = 0;
      const delay = i * 0.06;
      s.alpha = 0;
      this.addActor(s, (dt) => {
        life += dt;
        if (life < delay) return true;
        const p = (life - delay) / 1.3;
        s.x += vx * dt;
        s.y += vy * dt;
        s.rotation += spin * dt;
        s.alpha = p < 0.15 ? p / 0.15 : 1 - Math.max(0, (p - 0.5) / 0.5);
        return p < 1;
      });
    }
  }

  private throwBall() {
    const u = this.unit;
    const { width } = this.app.screen;
    const { x: px, y: ground } = this.feet;
    const ball = new Sprite(this.props.ball);
    ball.anchor.set(0.5, 1);
    ball.scale.set(0.42 * u);
    let x = -30 * u;
    let t = 0;
    let bumped = false;
    const speed = (px - 50 * u - x) / 0.9;
    this.addActor(ball, (dt) => {
      t += dt;
      x += speed * dt * (bumped ? 1.3 : 1);
      const bounceH = (bumped ? 34 : 22) * u * Math.exp(-t * 0.8);
      ball.position.set(x, ground - Math.abs(Math.sin(t * 7)) * bounceH);
      ball.rotation += dt * 8;
      if (!bumped && x > px - 50 * u) {
        bumped = true;
        this.rig?.play('bigHop', 'joy', 1.4);
        this.burst('sparkle', 3);
        x = px + 40 * u;
      }
      return x < width + 40 * u;
    });
  }

  private blowBubbles() {
    const u = this.unit;
    const { x: px, y: ground } = this.feet;
    this.rig?.play('hop', 'joy', 2.5);
    setTimeout(() => this.rig?.play('hop'), 700);
    setTimeout(() => this.rig?.play('hop'), 1400);
    for (let i = 0; i < 7; i++) {
      const b = new Sprite(this.props.bubble);
      b.anchor.set(0.5);
      const scale = (0.25 + Math.random() * 0.25) * u;
      b.scale.set(scale);
      const x0 = px + (Math.random() - 0.5) * 120 * u;
      const popAt = 1.2 + Math.random() * 1.6;
      let t = -i * 0.18;
      b.alpha = 0;
      this.addActor(b, (dt) => {
        t += dt;
        if (t < 0) return true;
        b.alpha = Math.min(1, t * 3);
        b.position.set(x0 + Math.sin(t * 3 + i) * 10 * u, ground - 20 * u - t * 45 * u);
        if (t > popAt) {
          this.sparkleAt(b.x, b.y);
          return false;
        }
        return true;
      });
    }
  }

  private sparkleAt(x: number, y: number) {
    const s = new Sprite(this.props.sparkle);
    s.anchor.set(0.5);
    s.position.set(x, y);
    const base = 0.18 * this.unit;
    let t = 0;
    this.addActor(s, (dt) => {
      t += dt / 0.35;
      s.scale.set(base * (0.6 + t));
      s.alpha = 1 - t;
      return t < 1;
    });
  }
}
