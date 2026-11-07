/**
 * Ready-made histories for demo mode, so a reviewer can see every pet state
 * in a couple of minutes instead of a couple of weeks.
 */
import { addDays } from './dates';
import { GOOD_DAY, dayScore } from './rules';
import type { GameState, Habit, HabitLog, ISODate, Pet, PetEventRecord } from './types';

export type ScenarioId = 'fresh' | 'thriving' | 'lapsed' | 'almostGrown';

export const SCENARIOS: { id: ScenarioId; label: string; description: string }[] = [
  { id: 'thriving', label: 'Two good weeks', description: 'A happy Teen with a streak, treats to spend and a few memories.' },
  { id: 'lapsed', label: 'Missed 3 days', description: 'A sad pet. Log any habit to see the welcome back.' },
  { id: 'almostGrown', label: 'One step from Grown', description: 'Finish one more habit today to watch it grow up.' },
  { id: 'fresh', label: 'Fresh start', description: 'Just adopted. No history yet.' },
];

function full(habits: Habit[]): Record<string, number> {
  return Object.fromEntries(habits.map((h) => [h.id, h.target]));
}

/** Most habits done, but the last one only half way: still a good day. */
function mostly(habits: Habit[]): Record<string, number> {
  const day = full(habits);
  const last = habits[habits.length - 1];
  if (habits.length > 1) day[last.id] = Math.floor(last.target / 2);
  return day;
}

/**
 * Today's counts sitting just below a good day: add check-ins one at a time
 * (bigger habits first) and stop right before the day would count.
 */
function oneTapShort(base: GameState, today: ISODate): Record<string, number> {
  const day: Record<string, number> = {};
  const order = [...base.habits].sort((a, b) => b.target - a.target);
  for (const h of order) {
    for (let n = 1; n <= h.target; n++) {
      day[h.id] = n;
      const probe = { ...base, log: { ...base.log, [today]: day } };
      if ((dayScore(probe, today) ?? 0) >= GOOD_DAY) {
        day[h.id] = n - 1;
        return day;
      }
    }
  }
  return day;
}

export function buildScenario(id: ScenarioId, pet: Pet, habitsIn: Habit[], today: ISODate): GameState {
  const daysAgo = { fresh: 0, thriving: 15, lapsed: 11, almostGrown: 21 }[id];
  const adoptedOn = addDays(today, -daysAgo);
  const habits = habitsIn
    .filter((h) => !h.archivedOn)
    .map((h) => ({ ...h, createdOn: adoptedOn }));
  const log: HabitLog = {};
  const events: PetEventRecord[] = [];
  const day = (i: number) => addDays(adoptedOn, i);

  if (id === 'thriving') {
    for (let i = 0; i < daysAgo; i++) log[day(i)] = i % 5 === 3 ? mostly(habits) : full(habits);
    log[today] = { [habits[0].id]: Math.ceil(habits[0].target / 2) };
    events.push(
      { type: 'toy', date: day(4), cost: 1 },
      { type: 'game', date: day(9), cost: 2, score: 12 },
      ...Array.from({ length: 6 }, (_, i) => ({ type: 'pet' as const, date: day(i * 2), cost: 0 })),
    );
  }
  if (id === 'lapsed') {
    for (let i = 0; i < daysAgo - 3; i++) log[day(i)] = i % 3 === 1 ? mostly(habits) : full(habits);
    events.push({ type: 'toy', date: day(3), cost: 1 });
  }
  if (id === 'almostGrown') {
    for (let i = 0; i < daysAgo; i++) log[day(i)] = i === 7 ? {} : i % 4 === 2 ? mostly(habits) : full(habits);
    // 20 good days so far; one more makes 21 (Grown)
    const base: GameState = { pet: { ...pet, adoptedOn }, habits, log, events };
    log[today] = oneTapShort(base, today);
    events.push(
      { type: 'game', date: day(12), cost: 2, score: 16 },
      ...Array.from({ length: 10 }, (_, i) => ({ type: 'pet' as const, date: day(i * 2), cost: 0 })),
    );
  }

  return { pet: { ...pet, adoptedOn }, habits, log, events };
}
