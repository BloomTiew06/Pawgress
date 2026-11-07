import type { HabitIcon } from '../engine/types';

export type UiIcon =
  | 'plus' | 'minus' | 'check' | 'paw' | 'ball' | 'bubbles' | 'star' | 'scrapbook'
  | 'list' | 'gear' | 'clock' | 'close' | 'trash' | 'edit' | 'arrowRight' | 'treat' | 'flame' | 'lock';

export type IconName = HabitIcon | UiIcon;

/** Hand-drawn style line icons on a 24px grid. */
const PATHS: Record<IconName, string> = {
  water: 'M6.5 4h11l-1.6 16h-7.8z M7.4 10h9.2',
  pencil: 'M15.5 4.5l4 4L9 19l-5 1 1-5z M13.5 6.5l4 4',
  run: 'M14 5.5a1.6 1.6 0 1 0 0.1 0 M9 21l3-6 3 2 1 4 M12 15l1-5-4 1-2 3 M13 10l3 3 3-1',
  book: 'M12 6.5C10 5 7 4.6 4 5v13c3-.4 6 0 8 1.5 2-1.5 5-1.9 8-1.5V5c-3-.4-6 0-8 1.5z M12 6.5v13',
  moon: 'M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5z',
  leaf: 'M5 19c0-8 5-13 14-14 0 9-5 14-13 14z M5 19l8-8',
  apple: 'M12 8c-2-1.6-6-1.3-7 2.4-1 3.8 1.4 9.6 4.4 9.6 1.2 0 1.6-.6 2.6-.6s1.4.6 2.6.6c3 0 5.4-5.8 4.4-9.6C18 6.7 14 6.4 12 8z M12 8c0-2 1-3.5 3-4',
  sun: 'M12 8.2a3.8 3.8 0 1 0 0.1 0 M12 2.5v2.5 M12 19v2.5 M2.5 12H5 M19 12h2.5 M5.3 5.3l1.8 1.8 M16.9 16.9l1.8 1.8 M18.7 5.3l-1.8 1.8 M7.1 16.9l-1.8 1.8',
  heart: 'M12 20C6 16 3.5 12.5 4.3 9 5 6 9 5 12 8.4 15 5 19 6 19.7 9c.8 3.5-1.7 7-7.7 11z',
  star: 'M12 3.5l2.5 5.5 6 .6-4.5 4 1.3 6-5.3-3.1-5.3 3.1 1.3-6-4.5-4 6-.6z',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  check: 'M4.5 12.5l5 5 10-11',
  paw: 'M12 13c-3 0-5.5 2.6-5.5 4.6 0 1.6 1.4 2.2 2.8 2.2 1.1 0 1.7-.5 2.7-.5s1.6.5 2.7.5c1.4 0 2.8-.6 2.8-2.2 0-2-2.5-4.6-5.5-4.6z M6.2 9.6a1.7 2.1 0 1 0 .1 0 M9.6 5.2a1.8 2.3 0 1 0 .1 0 M14.4 5.2a1.8 2.3 0 1 0 .1 0 M17.8 9.6a1.7 2.1 0 1 0 .1 0',
  ball: 'M12 4a8 8 0 1 0 .1 0 M4.5 10c4.5 2.5 10.5 2.5 15 0 M5.5 16c4-2 9-2 13 0',
  bubbles: 'M9 9.5a4.5 4.5 0 1 0 .1 0 M17 5a2.6 2.6 0 1 0 .1 0 M17.5 14a3 3 0 1 0 .1 0',
  scrapbook: 'M5 4h12.5A1.5 1.5 0 0 1 19 5.5V20H6.5A1.5 1.5 0 0 1 5 18.5z M5 17h14 M9 8.5h6 M9 11.5h4',
  list: 'M9 7h11 M9 12h11 M9 17h11 M4.5 7h.5 M4.5 12h.5 M4.5 17h.5',
  gear: 'M12 9a3 3 0 1 0 .1 0 M12 3v2.5 M12 18.5V21 M3 12h2.5 M18.5 12H21 M5.6 5.6l1.8 1.8 M16.6 16.6l1.8 1.8 M18.4 5.6l-1.8 1.8 M7.4 16.6l-1.8 1.8',
  clock: 'M12 4a8 8 0 1 0 .1 0 M12 8v4.5l3 2',
  close: 'M6 6l12 12 M18 6L6 18',
  trash: 'M5 7h14 M9.5 7V4.5h5V7 M7 7l1 13h8l1-13 M10.5 11v5 M13.5 11v5',
  edit: 'M15.5 4.5l4 4L9 19l-5 1 1-5z',
  arrowRight: 'M5 12h13 M13 7l5 5-5 5',
  treat: 'M5 12c0-4.5 3-7 7-7s7 2.5 7 7-3 7-7 7-7-2.5-7-7z M9.5 10h.1 M14 11h.1 M11.5 15h.1',
  flame: 'M12 21c-3.6 0-6-2.4-6-5.6 0-3.2 2.4-5 3.4-8.4 1.6 1.4 2.2 3 2.2 4.4 1-1 1.6-2.4 1.6-4 2.8 2 4.8 5 4.8 8 0 3.2-2.4 5.6-6 5.6z',
  lock: 'M6.5 11h11v9h-11z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
};

export function Icon({ name, size = 22, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
