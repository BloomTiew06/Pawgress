/**
 * The pet engine: plain functions from (state, today) to everything the UI shows.
 * Nothing here stores mood or growth; it is always derived from the habit log,
 * which is what makes demo time travel and testing straightforward.
 */
import { addDays, dateRange } from './dates';
import type { GameState, Habit, ISODate, Mood, ReactionKind, Stage } from './types';

/** A day counts toward growth when at least half of the day's habit progress is done. */
export const GOOD_DAY = 0.5;
/** Below this a past day counts as missed. */
export const MISSED_DAY = 0.25;
/** Score used for days before the pet was adopted, so new pets start "okay". */
const NEUTRAL = 0.6;
const MOOD_WINDOW = 5;

export const STAGES: { stage: Stage; at: number }[] = [
  { stage: 'baby', at: 0 },
  { stage: 'kid', at: 3 },
  { stage: 'teen', at: 10 },
  { stage: 'grown', at: 21 },
];

export const COSTS = { toy: 1, game: 2 } as const;

function isActive(h: Habit, date: ISODate) {
  return h.createdOn <= date && (!h.archivedOn || date < h.archivedOn);
}

export function activeHabits(s: GameState, date: ISODate): Habit[] {
  return s.habits.filter((h) => isActive(h, date));
}

export function countFor(s: GameState, habitId: string, date: ISODate): number {
  return s.log[date]?.[habitId] ?? 0;
}

/** 0..1 average of capped progress across habits active that day; null with no habits. */
export function dayScore(s: GameState, date: ISODate): number | null {
  const habits = activeHabits(s, date);
  if (habits.length === 0) return null;
  const total = habits.reduce((sum, h) => sum + Math.min(countFor(s, h.id, date) / h.target, 1), 0);
  return total / habits.length;
}

function hasActivity(s: GameState, date: ISODate) {
  return Object.values(s.log[date] ?? {}).some((n) => n > 0);
}

/** Consecutive missed days right before today. Today never counts: it isn't over yet. */
export function missedDays(s: GameState, today: ISODate): number {
  let n = 0;
  for (let d = addDays(today, -1); d >= s.pet.adoptedOn; d = addDays(d, -1)) {
    const score = dayScore(s, d);
    if (score === null || score >= MISSED_DAY) break;
    n++;
  }
  return n;
}

/**
 * 0..100. The recent past sets the baseline, weighted toward yesterday.
 * Anything done today can only lift it, so opening the app and acting always helps.
 */
export function moodValue(s: GameState, today: ISODate): number {
  let weighted = 0;
  let weights = 0;
  for (let i = 1; i <= MOOD_WINDOW; i++) {
    const d = addDays(today, -i);
    const score = d < s.pet.adoptedOn ? NEUTRAL : (dayScore(s, d) ?? NEUTRAL);
    const w = MOOD_WINDOW + 1 - i;
    weighted += score * w;
    weights += w;
  }
  const past = (weighted / weights) * 100;
  const todayScore = dayScore(s, today) ?? 0;
  const fromToday = todayScore > 0 ? 40 + 60 * todayScore : 0;
  return Math.round(Math.max(past, fromToday));
}

export function moodFromValue(v: number): Mood {
  if (v >= 70) return 'thriving';
  if (v >= 40) return 'okay';
  return 'sad';
}

export function moodLevel(s: GameState, today: ISODate): Mood {
  return moodFromValue(moodValue(s, today));
}

export function goodDayCount(s: GameState, today: ISODate): number {
  return dateRange(s.pet.adoptedOn, today).filter((d) => (dayScore(s, d) ?? 0) >= GOOD_DAY).length;
}

export function stageFor(goodDays: number): Stage {
  let stage: Stage = 'baby';
  for (const st of STAGES) if (goodDays >= st.at) stage = st.stage;
  return stage;
}

export function stageProgress(s: GameState, today: ISODate) {
  const goodDays = goodDayCount(s, today);
  const stage = stageFor(goodDays);
  const idx = STAGES.findIndex((x) => x.stage === stage);
  const next = STAGES[idx + 1];
  return {
    stage,
    goodDays,
    prevAt: STAGES[idx].at,
    nextAt: next?.at ?? null,
    nextStage: next?.stage ?? null,
  };
}

/** Good days in a row, ending today if today is already good, otherwise yesterday. */
export function streak(s: GameState, today: ISODate): number {
  let d = (dayScore(s, today) ?? 0) >= GOOD_DAY ? today : addDays(today, -1);
  let n = 0;
  while (d >= s.pet.adoptedOn && (dayScore(s, d) ?? 0) >= GOOD_DAY) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Treats earned on a day: one per finished habit, plus one for finishing everything. */
export function treatsEarnedOn(s: GameState, date: ISODate): number {
  const habits = activeHabits(s, date);
  const done = habits.filter((h) => countFor(s, h.id, date) >= h.target).length;
  return done + (habits.length > 0 && done === habits.length ? 1 : 0);
}

export function treatBalance(s: GameState, today: ISODate): number {
  const earned = dateRange(s.pet.adoptedOn, today).reduce((n, d) => n + treatsEarnedOn(s, d), 0);
  const spent = s.events.filter((e) => e.date <= today).reduce((n, e) => n + e.cost, 0);
  return earned - spent;
}

/** Apply one check-in (or an undo with delta -1) and return the new state. */
export function withCheckIn(s: GameState, habitId: string, date: ISODate, delta = 1): GameState {
  const day = { ...(s.log[date] ?? {}) };
  day[habitId] = Math.max(0, (day[habitId] ?? 0) + delta);
  return { ...s, log: { ...s.log, [date]: day } };
}

/** Which reaction the pet should play for a check-in, judged against the state before it. */
export function reactionForCheckIn(before: GameState, habitId: string, today: ISODate): ReactionKind {
  const after = withCheckIn(before, habitId, today);
  if (stageFor(goodDayCount(after, today)) !== stageFor(goodDayCount(before, today))) return 'stageUp';
  if (missedDays(before, today) >= 2 && !hasActivity(before, today)) return 'welcomeBack';
  if ((dayScore(after, today) ?? 0) >= 1 && (dayScore(before, today) ?? 0) < 1) return 'dayDone';
  const habit = before.habits.find((h) => h.id === habitId);
  if (habit && countFor(after, habitId, today) === habit.target) return 'habitDone';
  return 'habitTap';
}

export function greetingFor(mood: Mood): ReactionKind {
  return mood === 'thriving' ? 'greetThriving' : mood === 'okay' ? 'greetOkay' : 'greetSad';
}

export type MemoryId =
  | 'first-step' | 'full-day' | 'kid' | 'teen' | 'grown' | 'week-streak'
  | 'welcome-back' | 'fifty-check-ins' | 'first-play' | 'star-catcher' | 'gentle-paws';

export interface UnlockedMemory {
  id: MemoryId;
  date: ISODate;
}

/** Every memory earned up to today, with the day it happened. */
export function unlockedMemories(s: GameState, today: ISODate): UnlockedMemory[] {
  const found = new Map<MemoryId, ISODate>();
  const mark = (id: MemoryId, date: ISODate) => {
    if (!found.has(id)) found.set(id, date);
  };

  let good = 0;
  let run = 0;
  let quiet = 0;
  let units = 0;
  for (const d of dateRange(s.pet.adoptedOn, today)) {
    const score = dayScore(s, d) ?? 0;
    const active = hasActivity(s, d);
    units += Object.values(s.log[d] ?? {}).reduce((a, b) => a + b, 0);

    if (active) mark('first-step', d);
    if (score >= 1) mark('full-day', d);
    if (active && quiet >= 2) mark('welcome-back', d);
    if (units >= 50) mark('fifty-check-ins', d);

    if (score >= GOOD_DAY) {
      good++;
      run++;
    } else {
      run = 0;
    }
    for (const st of STAGES) if (st.at > 0 && good >= st.at) mark(st.stage as MemoryId, d);
    if (run >= 7) mark('week-streak', d);

    // A day only counts as quiet once it's over, so judge it after processing.
    if (d < today) quiet = score < MISSED_DAY ? quiet + 1 : 0;
  }

  const events = s.events.filter((e) => e.date <= today);
  const play = events.find((e) => e.type === 'toy' || e.type === 'game');
  if (play) mark('first-play', play.date);
  const star = events.find((e) => e.type === 'game' && (e.score ?? 0) >= 15);
  if (star) mark('star-catcher', star.date);
  const pets = events.filter((e) => e.type === 'pet');
  if (pets.length >= 10) mark('gentle-paws', pets[9].date);

  return [...found].map(([id, date]) => ({ id, date }));
}
