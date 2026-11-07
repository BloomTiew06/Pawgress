import { ImageSource, Texture } from 'pixi.js';
import {
  PALETTES, VIEW, bodyPart, earPart, facePart, frontEarPart, scarfPart, svgDoc, tailPart,
  type FaceKind,
} from '../art/petArt';
import { PROP_VIEW, PROPS, type PropId } from '../art/props';
import type { AnimalId } from '../engine/types';

/** Textures are rasterized at this multiple of the 120-unit art space. */
export const RES = 4;

async function svgTexture(svg: string): Promise<Texture> {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  return new Texture({ source: new ImageSource({ resource: img }) });
}

export interface PetTextures {
  ear: Texture | null;
  frontEar: Texture | null;
  tail: Texture | null;
  body: Texture;
  scarf: Texture;
  faces: Record<FaceKind, Texture>;
}

const petCache = new Map<AnimalId, Promise<PetTextures>>();

export function loadPetTextures(animal: AnimalId): Promise<PetTextures> {
  let p = petCache.get(animal);
  if (!p) {
    p = buildPetTextures(animal);
    petCache.set(animal, p);
  }
  return p;
}

async function buildPetTextures(animal: AnimalId): Promise<PetTextures> {
  const c = PALETTES[animal];
  const px = VIEW * RES;
  const tex = (markup: string) => (markup ? svgTexture(svgDoc(markup, px)) : Promise.resolve(null));
  const faceKinds: FaceKind[] = ['happy', 'okay', 'sad', 'blink', 'joy'];
  const [ear, frontEar, tail, body, scarf, ...faces] = await Promise.all([
    tex(earPart(animal, c)),
    tex(frontEarPart(animal, c)),
    tex(tailPart(animal, c)),
    tex(bodyPart(animal, c)),
    tex(scarfPart()),
    ...faceKinds.map((k) => tex(facePart(k))),
  ]);
  return {
    ear, frontEar, tail,
    body: body!,
    scarf: scarf!,
    faces: Object.fromEntries(faceKinds.map((k, i) => [k, faces[i]!])) as Record<FaceKind, Texture>,
  };
}

const propCache = new Map<PropId, Promise<Texture>>();

export function loadProp(id: PropId): Promise<Texture> {
  let p = propCache.get(id);
  if (!p) {
    p = svgTexture(`<svg xmlns="http://www.w3.org/2000/svg" width="${PROP_VIEW * 3}" height="${PROP_VIEW * 3}" viewBox="0 0 ${PROP_VIEW} ${PROP_VIEW}">${PROPS[id]}</svg>`);
    propCache.set(id, p);
  }
  return p;
}

export async function loadProps(ids: PropId[]): Promise<Record<PropId, Texture>> {
  const list = await Promise.all(ids.map(loadProp));
  return Object.fromEntries(ids.map((id, i) => [id, list[i]])) as Record<PropId, Texture>;
}

/** A soft noise image for the boiling-ink displacement filter. */
export function noiseTexture(size = 256): Texture {
  const small = document.createElement('canvas');
  small.width = small.height = 32;
  const sctx = small.getContext('2d')!;
  const img = sctx.createImageData(32, 32);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = Math.random() * 255;
    img.data[i + 1] = Math.random() * 255;
    img.data[i + 2] = 128;
    img.data[i + 3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(small, 0, 0, size, size);
  return Texture.from(canvas);
}
