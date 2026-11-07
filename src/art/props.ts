/** Small ink drawings used as particles, toys and scrapbook props (120x120 space unless noted). */
import { INK } from './petArt';

const st = (w = 2.4) => ` stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

export type PropId = 'heart' | 'sparkle' | 'star' | 'goldStar' | 'ball' | 'bubble' | 'water' | 'sun' | 'treat';

/** Each prop is drawn in a 48x48 box. */
export const PROP_VIEW = 48;

export const PROPS: Record<PropId, string> = {
  heart: `<path d="M24 40 C10 30 6 22 9 15 C12 9 20 9 24 16 C28 9 36 9 39 15 C42 22 38 30 24 40 Z" fill="#E59A8C"${st()}/>`,
  sparkle: `<path d="M24 6 C26 18 30 22 42 24 C30 26 26 30 24 42 C22 30 18 26 6 24 C18 22 22 18 24 6 Z" fill="#F4D58D"${st(2)}/>`,
  star: `<path d="M24 5 L29 18 L43 18 L32 27 L36 41 L24 33 L12 41 L16 27 L5 18 L19 18 Z" fill="#F4D58D"${st()}/>`,
  goldStar: `<path d="M24 5 L29 18 L43 18 L32 27 L36 41 L24 33 L12 41 L16 27 L5 18 L19 18 Z" fill="#E9B44C"${st()}/><circle cx="20" cy="20" r="2.5" fill="#FFF6DD"/>`,
  ball: `<circle cx="24" cy="24" r="16" fill="#D98C7A"${st()}/><path d="M9 20 C18 26 30 26 39 20 M12 32 C20 28 28 28 36 32" fill="none"${st(1.8)}/>`,
  bubble: `<circle cx="24" cy="24" r="15" fill="#DCEAF5" fill-opacity=".55"${st(1.8)}/><path d="M16 18 q3 -4 8 -4" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`,
  water: `<path d="M13 10 L35 10 L32 40 L16 40 Z" fill="#DCEAF5"${st()}/><path d="M14.5 20 L33.5 20 L32 40 L16 40 Z" fill="#9FC3E0"/><path d="M13 10 L35 10 L32 40 L16 40 Z" fill="none"${st()}/>`,
  sun: `<circle cx="24" cy="24" r="9" fill="#F4D58D"${st()}/><path d="M24 4 v6 M24 38 v6 M4 24 h6 M38 24 h6 M10 10 l4 4 M34 34 l4 4 M38 10 l-4 4 M14 34 l-4 4" fill="none"${st(2)}/>`,
  treat: `<path d="M10 24 C10 14 16 10 24 10 C32 10 38 14 38 24 C38 34 32 38 24 38 C16 38 10 34 10 24 Z" fill="#E2B582"${st(2.2)}/><circle cx="19" cy="20" r="2" fill="${INK}"/><circle cx="29" cy="22" r="2" fill="${INK}"/><circle cx="23" cy="30" r="2" fill="${INK}"/>`,
};

export function propSvg(id: PropId, px = PROP_VIEW): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${PROP_VIEW} ${PROP_VIEW}">${PROPS[id]}</svg>`;
}
