/**
 * Starfall: the launch mini-game. Move your pet left and right to catch falling
 * stars for 30 seconds. Gold stars are worth 3.
 */
import { Application, Container, DisplacementFilter, Sprite, type Texture } from 'pixi.js';
import type { PropId } from '../art/props';
import type { AnimalId } from '../engine/types';
import { PetRig } from './PetRig';
import { loadPetTextures, loadProps, noiseTexture } from './textures';

export const GAME_SECONDS = 30;

interface Star { sprite: Sprite; vy: number; value: number; spin: number }

export interface StarfallCallbacks {
  onScore(score: number): void;
  onTime(secondsLeft: number): void;
  onEnd(score: number): void;
}

export class StarfallGame {
  private app!: Application;
  private rig!: PetRig;
  private props!: Record<PropId, Texture>;
  private field = new Container();
  private stars: Star[] = [];
  private fx: { sprite: Sprite; t: number }[] = [];
  private targetX = 0;
  private keys = { left: false, right: false };
  private elapsed = 0;
  private spawnIn = 0.4;
  private score = 0;
  private running = false;
  private destroyed = false;
  private boilSprite!: Sprite;
  private boilClock = 0;
  private lastSecond = GAME_SECONDS;

  private constructor(private cb: StarfallCallbacks, private reducedMotion: boolean) {}

  static async create(host: HTMLElement, animal: AnimalId, cb: StarfallCallbacks, reducedMotion: boolean) {
    const game = new StarfallGame(cb, reducedMotion);
    await game.init(host, animal);
    return game;
  }

  private async init(host: HTMLElement, animal: AnimalId) {
    const app = new Application();
    await app.init({
      backgroundAlpha: 0,
      resizeTo: host,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    if (this.destroyed) {
      app.destroy({ removeView: true });
      return;
    }
    this.app = app;
    host.appendChild(app.canvas);
    app.canvas.setAttribute('aria-hidden', 'true');

    const [tex, props] = await Promise.all([loadPetTextures(animal), loadProps(['star', 'goldStar', 'sparkle'])]);
    if (this.destroyed) return;
    this.props = props as Record<PropId, Texture>;
    this.rig = new PetRig(tex, animal);
    this.rig.mood = 'thriving';
    this.rig.stage = 'kid';
    this.rig.reducedMotion = this.reducedMotion;
    this.rig.settle();

    this.boilSprite = new Sprite(noiseTexture());
    this.boilSprite.alpha = 0;
    this.boilSprite.scale.set(3);
    const pet = new Container();
    pet.addChild(this.rig);
    pet.filters = [new DisplacementFilter({ sprite: this.boilSprite, scale: 4 })];

    app.stage.addChild(this.boilSprite, this.field, pet);
    this.targetX = app.screen.width / 2;
    this.layout();
    app.renderer.on('resize', () => this.layout());

    // Pointer: the pet follows your finger or cursor anywhere on the field.
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointermove', (e) => (this.targetX = e.global.x));
    app.stage.on('pointerdown', (e) => (this.targetX = e.global.x));

    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    app.ticker.add((t) => this.tick(t.deltaMS / 1000));
  }

  private onKey = (e: KeyboardEvent) => {
    const down = e.type === 'keydown';
    if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = down;
    else if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = down;
    else return;
    e.preventDefault();
  };

  private get unit() {
    return Math.min(this.app.screen.width / 420, this.app.screen.height / 380) * 1.1;
  }

  private layout() {
    if (!this.app?.renderer) return;
    this.app.stage.hitArea = this.app.screen;
    this.rig.scale.set(this.unit);
    this.rig.y = this.app.screen.height - 10;
    this.rig.x = Math.min(Math.max(this.rig.x || this.targetX, 0), this.app.screen.width);
  }

  start() {
    this.stars.forEach((s) => s.sprite.destroy());
    this.stars = [];
    this.score = 0;
    this.elapsed = 0;
    this.lastSecond = GAME_SECONDS;
    this.running = true;
    this.cb.onScore(0);
    this.cb.onTime(GAME_SECONDS);
  }

  private spawn() {
    const w = this.app.screen.width;
    const gold = Math.random() < 0.16;
    const s = new Sprite(gold ? this.props.goldStar : this.props.star);
    s.anchor.set(0.5);
    s.scale.set((gold ? 0.36 : 0.3) * this.unit);
    s.position.set(24 + Math.random() * (w - 48), -20);
    this.field.addChild(s);
    const pace = 1 + this.elapsed / GAME_SECONDS;
    this.stars.push({ sprite: s, vy: (130 + Math.random() * 60) * pace * this.unit, value: gold ? 3 : 1, spin: (Math.random() - 0.5) * 3 });
  }

  private tick(dt: number) {
    if (this.destroyed) return;
    const { width, height } = this.app.screen;
    const u = this.unit;

    // Move toward the pointer, or by keyboard
    if (this.keys.left) this.targetX -= 420 * u * dt;
    if (this.keys.right) this.targetX += 420 * u * dt;
    this.targetX = Math.min(Math.max(this.targetX, 58 * u), width - 58 * u);
    const dx = this.targetX - this.rig.x;
    this.rig.x += dx * Math.min(1, dt * 10);
    this.rig.mover.skew.x = Math.max(-0.15, Math.min(0.15, -dx / (400 * u)));
    this.rig.update(dt);

    this.boilClock += dt;
    if (!this.reducedMotion && this.boilClock > 0.13) {
      this.boilClock = 0;
      this.boilSprite.position.set(-Math.random() * 300, -Math.random() * 300);
    }

    // Sparkle effects
    this.fx = this.fx.filter((f) => {
      f.t += dt / 0.4;
      f.sprite.alpha = 1 - f.t;
      f.sprite.scale.set(0.2 * u * (0.6 + f.t));
      if (f.t >= 1) f.sprite.destroy();
      return f.t < 1;
    });

    if (!this.running) return;
    this.elapsed += dt;
    const left = Math.max(0, Math.ceil(GAME_SECONDS - this.elapsed));
    if (left !== this.lastSecond) {
      this.lastSecond = left;
      this.cb.onTime(left);
    }

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawn();
      this.spawnIn = 0.6 - 0.25 * (this.elapsed / GAME_SECONDS);
    }

    // Catch zone: around the pet's head
    const headX = this.rig.x;
    const headY = this.rig.y - 70 * u;
    const reach = 46 * u;
    this.stars = this.stars.filter((star) => {
      const s = star.sprite;
      s.y += star.vy * dt;
      s.rotation += star.spin * dt;
      if (Math.hypot(s.x - headX, s.y - headY) < reach) {
        this.score += star.value;
        this.cb.onScore(this.score);
        this.rig.play('hop', 'joy', 0.5);
        const fx = new Sprite(this.props.sparkle);
        fx.anchor.set(0.5);
        fx.position.set(s.x, s.y);
        this.field.addChild(fx);
        this.fx.push({ sprite: fx, t: 0 });
        s.destroy();
        return false;
      }
      if (s.y > height + 30) {
        s.destroy();
        return false;
      }
      return true;
    });

    if (this.elapsed >= GAME_SECONDS) {
      this.running = false;
      this.stars.forEach((s) => s.sprite.destroy());
      this.stars = [];
      this.rig.play('bigHop', 'joy', 1.5);
      this.cb.onEnd(this.score);
    }
  }

  destroy() {
    this.destroyed = true;
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    this.app?.destroy({ removeView: true }, { children: true });
  }
}
