/**
 * Storybook Ink pet art, drawn as SVG in a shared 120x120 space.
 *
 * Every animal is the same base body plus three swappable layers (ears, tail,
 * markings). Parts are exported one by one so the Pixi rig can move them
 * independently, and composed into one SVG for static pictures in the DOM.
 */
import type { AnimalId, Mood, Stage } from '../engine/types';

export const INK = '#26344F';
export const VIEW = 120;

export type FaceKind = 'happy' | 'okay' | 'sad' | 'blink' | 'joy';

interface Palette { tint: string; accent: string; inner: string }

export const PALETTES: Record<AnimalId, Palette> = {
  cat: { tint: '#C3CCD9', accent: '#8C99AE', inner: '#E9B9B2' },
  pup: { tint: '#EAD2B5', accent: '#B98B63', inner: '#B98B63' },
  bunny: { tint: '#F1ECEC', accent: '#D9CFCF', inner: '#EBB7B4' },
  cub: { tint: '#CDAE93', accent: '#EBDCCB', inner: '#EBDCCB' },
};

/** Where each moving part rotates from, and how far it droops when sad (degrees, clockwise). */
export interface Joint { pivot: [number, number]; rest: number; sad: number }

export interface Rig {
  ear?: Joint;
  frontEar?: Joint;
  tail?: Joint;
}

export const RIGS: Record<AnimalId, Rig> = {
  cat: { ear: { pivot: [40, 52], rest: 0, sad: -32 }, tail: { pivot: [92, 94], rest: 0, sad: 78 } },
  pup: { frontEar: { pivot: [30, 52], rest: 0, sad: 12 }, tail: { pivot: [96, 86], rest: 0, sad: 84 } },
  bunny: { ear: { pivot: [47, 49], rest: -6, sad: -72 }, tail: { pivot: [100, 96], rest: 0, sad: 0 } },
  cub: { ear: { pivot: [42, 56], rest: 0, sad: -22 } },
};

/** Overall size per growth stage, and how big the ears are relative to the body (babies have big ears). */
export const STAGE_SHAPE: Record<Stage, { scale: number; ear: number }> = {
  baby: { scale: 0.64, ear: 1.16 },
  kid: { scale: 0.78, ear: 1.08 },
  teen: { scale: 0.9, ear: 1.0 },
  grown: { scale: 1.0, ear: 1.0 },
};

const st = (w = 2.2) => ` stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

function mix(hex: string, other: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(other);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Faded colors for a sad pet (used for static pictures; Pixi uses a color filter instead). */
export function paletteFor(animal: AnimalId, mood: Mood): Palette {
  const p = PALETTES[animal];
  if (mood !== 'sad') return p;
  const gray = '#C5CEDA';
  return { tint: mix(p.tint, gray, 0.45), accent: mix(p.accent, gray, 0.4), inner: mix(p.inner, gray, 0.4) };
}

// ---------- parts ----------

/** The left ear in its rest pose. The right ear is the same drawing mirrored. */
export function earPart(animal: AnimalId, c: Palette): string {
  switch (animal) {
    case 'cat':
      return `<path d="M29 60 Q26 38 31 22 Q44 30 53 47" fill="${c.tint}"${st()}/><path d="M34 46 Q32 36 34 30 Q40 34 44 42" fill="${c.inner}"/>`;
    case 'bunny':
      return `<path d="M43 50 C34 32 35 8 44 4 C53 8 55 32 51 50" fill="${c.tint}"${st()}/><path d="M45 42 C40 30 41 15 44 11 C47 15 49 30 48 42" fill="${c.inner}"/>`;
    case 'cub':
      return `<circle cx="35" cy="49" r="12" fill="${c.tint}"${st()}/><circle cx="35" cy="49" r="5.5" fill="${c.inner}"/>`;
    default:
      return '';
  }
}

/** Floppy ears that hang in front of the body (the pup). */
export function frontEarPart(animal: AnimalId, c: Palette): string {
  if (animal !== 'pup') return '';
  return `<path d="M32 50 C18 46 10 64 15 80 C19 88 28 84 30 74 C32 64 36 56 32 50 Z" fill="${c.accent}"${st()}/>`;
}

export function tailPart(animal: AnimalId, c: Palette): string {
  const thick = (d: string, w: number) =>
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 4.4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c.tint}" stroke-width="${w}" stroke-linecap="round"/>`;
  switch (animal) {
    case 'cat':
      return thick('M92 94 C110 94 114 74 106 62', 6.6);
    case 'pup':
      return thick('M96 86 C106 82 110 72 106 64', 5.6);
    case 'bunny':
      return `<circle cx="100" cy="96" r="8" fill="#FFFFFF"${st(2)}/>`;
    default:
      return '';
  }
}

export function bodyPart(animal: AnimalId, c: Palette): string {
  const body = `<ellipse cx="60" cy="76" rx="42" ry="32" fill="${c.tint}"${st(2.4)}/>`;
  let marks = '';
  switch (animal) {
    case 'cat':
      marks =
        `<path d="M54 51 l2 6 M60 49 l0 7 M66 51 l-2 6" fill="none" stroke="${c.accent}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<path d="M57.5 81 L62.5 81 L60 84 Z" fill="${c.inner}"${st(1.4)}/>` +
        `<path d="M28 81 l-11 -3 M28 85 l-11 1 M92 81 l11 -3 M92 85 l11 1" fill="none"${st(1.5)}/>`;
      break;
    case 'pup':
      marks = `<ellipse cx="72" cy="74" rx="10" ry="9" fill="${c.accent}" opacity=".55"/><ellipse cx="60" cy="82" rx="4.5" ry="3.2" fill="${INK}"/>`;
      break;
    case 'bunny':
      marks = `<path d="M57.5 81 L62.5 81 L60 84 Z" fill="${c.inner}"${st(1.4)}/><path d="M30 83 l-9 -2 M90 83 l9 -2" fill="none"${st(1.4)}/>`;
      break;
    case 'cub':
      marks = `<ellipse cx="60" cy="88" rx="15" ry="11" fill="${c.accent}"/><ellipse cx="60" cy="82" rx="5" ry="3.4" fill="${INK}"/>`;
      break;
  }
  return body + marks;
}

export function facePart(kind: FaceKind): string {
  const s = ` fill="none"${st(2.4)}`;
  const cheeks = `<path d="M33 87 l4 -2 M35 90 l4 -2 M83 85 l4 2 M81 88 l4 2" stroke="#D98C7A" stroke-width="1.6" stroke-linecap="round"/>`;
  const smile = `<path d="M53 87 q7 7 14 0"${s}/>`;
  const small = `<path d="M55 88 q5 4 10 0"${s}/>`;
  switch (kind) {
    case 'happy':
      return `<path d="M42 74 q6 -8 12 0"${s}/><path d="M66 74 q6 -8 12 0"${s}/>${smile}${cheeks}`;
    case 'okay':
      return `<circle cx="48" cy="73" r="3.2" fill="${INK}"/><circle cx="72" cy="73" r="3.2" fill="${INK}"/>${small}`;
    case 'blink':
      return `<path d="M44 74 q4 2 8 0"${s}/><path d="M68 74 q4 2 8 0"${s}/>${small}`;
    case 'sad':
      return (
        `<path d="M42 78 q6 -1 12 -5"${s}/><path d="M66 73 q6 4 12 5"${s}/>` +
        `<path d="M54 92 q6 -5 12 0"${s}/>` +
        `<path d="M46 82 q-2 5 0 7 q2 -2 0 -7 Z" fill="#9FB7CF"${st(1.3)}/>`
      );
    case 'joy':
      return (
        `<path d="M42 74 q6 -9 12 0"${s}/><path d="M66 74 q6 -9 12 0"${s}/>` +
        `<path d="M51 85 Q60 100 69 85 Z" fill="${INK}"${st(2)}/>` +
        `<path d="M55 91 Q60 97 65 91 Q60 89 55 91 Z" fill="#D98C7A"/>${cheeks}`
      );
  }
}

/** A knitted scarf, the Grown stage's finishing touch. */
export function scarfPart(): string {
  return (
    `<path d="M24 96 C40 108 80 108 96 96 L97 103 C80 116 40 116 23 103 Z" fill="#D98C7A"${st(2)}/>` +
    `<path d="M70 108 L73 121 L81 119 L78 107 Z" fill="#D98C7A"${st(2)}/>` +
    `<path d="M36 103 l2 5 M50 106 l1 5 M64 107 l0 5 M84 104 l-2 5" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>`
  );
}

/** Wrap part markup in a standalone SVG document at a given pixel size. */
export function svgDoc(inner: string, px = VIEW, defs = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${VIEW} ${VIEW}">${defs}${inner}</svg>`;
}

// ---------- composed picture for the DOM ----------

let uid = 0;

export interface PetPictureOptions {
  mood: Mood;
  stage?: Stage;
  face?: FaceKind;
  /** Draw a soft watercolor wash behind the pet. */
  wash?: boolean;
}

const rot = (deg: number, [x, y]: [number, number]) => `rotate(${deg} ${x} ${y})`;
const scaleAt = (k: number, [x, y]: [number, number]) => `translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`;

export function faceForMood(mood: Mood): FaceKind {
  return mood === 'thriving' ? 'happy' : mood === 'okay' ? 'okay' : 'sad';
}

/** A complete, static pet as one inline SVG (with the hand-drawn wobble baked in). */
export function petPicture(animal: AnimalId, opts: PetPictureOptions): string {
  const { mood, stage = 'grown', wash = true } = opts;
  const face = opts.face ?? faceForMood(mood);
  const c = paletteFor(animal, mood);
  const rig = RIGS[animal];
  const shape = STAGE_SHAPE[stage];
  const sad = mood === 'sad';
  const id = `pp${++uid}`;

  const joint = (j: Joint | undefined, part: string, mirrored: boolean) => {
    if (!j || !part) return '';
    const angle = sad ? j.sad : j.rest;
    const one = `<g transform="${rot(angle, j.pivot)} ${scaleAt(shape.ear, j.pivot)}">${part}</g>`;
    return mirrored ? one + `<g transform="translate(${VIEW} 0) scale(-1 1)">${one}</g>` : one;
  };

  const squash = sad ? `translate(60 108) scale(1.04 0.9) translate(-60 -108)` : '';
  const body =
    `<g transform="${squash}">` +
    joint(rig.ear, earPart(animal, c), true) +
    bodyPart(animal, c) +
    `<g>${facePart(face)}</g>` +
    joint(rig.frontEar, frontEarPart(animal, c), true) +
    (stage === 'grown' ? scarfPart() : '') +
    `</g>`;
  const tail = rig.tail ? `<g transform="${rot(sad ? rig.tail.sad : rig.tail.rest, rig.tail.pivot)}">${tailPart(animal, c)}</g>` : '';

  const defs =
    `<defs><filter id="${id}w" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${uid % 9}"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>` +
    `<filter id="${id}s" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="10"/><feGaussianBlur stdDeviation="1.6"/></filter></defs>`;

  const washLayer = wash
    ? `<g filter="url(#${id}s)" opacity="${sad ? 0.35 : 0.55}"><ellipse cx="63" cy="82" rx="40" ry="28" fill="${c.tint}"/></g>`
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 128 128" aria-hidden="true">${defs}` +
    `<g transform="${scaleAt(shape.scale, [60, 112])}">` +
    `<ellipse cx="62" cy="113" rx="34" ry="4" fill="${INK}" opacity=".08"/>` +
    washLayer +
    `<g filter="url(#${id}w)">${tail}${body}</g>` +
    `</g></svg>`
  );
}
