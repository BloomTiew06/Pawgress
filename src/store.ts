/**
 * App state, saved on this device. It holds only facts (habits, check-ins, spending);
 * mood, growth, treats and memories are derived by the engine.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addDays, toISO } from './engine/dates';
import { COSTS, withCheckIn } from './engine/rules';
import { buildScenario, type ScenarioId } from './engine/scenarios';
import type { AnimalId, GameState, Habit, HabitIcon, ISODate, SpendKind } from './engine/types';

interface Settings {
  /** Demo time travel: days added to the real date. */
  dayOffset: number;
}

interface Store {
  game: GameState | null;
  settings: Settings;

  adopt(animal: AnimalId, name: string, habits: Omit<Habit, 'id' | 'createdOn'>[]): void;
  checkIn(habitId: string, delta?: 1 | -1): void;
  addHabit(h: Omit<Habit, 'id' | 'createdOn'>): void;
  updateHabit(id: string, patch: Partial<Pick<Habit, 'name' | 'icon' | 'target'>>): void;
  archiveHabit(id: string): void;
  spend(kind: SpendKind): void;
  /** Attach the final score to the game that was just paid for. */
  recordGameScore(score: number): void;
  recordPet(): void;
  renamePet(name: string): void;
  setDayOffset(n: number): void;
  loadScenario(id: ScenarioId): void;
  reset(): void;
}

export const newId = () => Math.random().toString(36).slice(2, 10);

/** Today as the app sees it, including demo time travel. */
export function todayFor(settings: Settings): ISODate {
  return addDays(toISO(new Date()), settings.dayOffset);
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const today = () => todayFor(get().settings);
      const update = (fn: (g: GameState) => GameState) => {
        const g = get().game;
        if (g) set({ game: fn(g) });
      };

      return {
        game: null,
        settings: { dayOffset: 0 },

        adopt(animal, name, habits) {
          const d = today();
          set({
            game: {
              pet: { animal, name, adoptedOn: d },
              habits: habits.map((h) => ({ ...h, id: newId(), createdOn: d })),
              log: {},
              events: [],
            },
          });
        },

        checkIn(habitId, delta = 1) {
          update((g) => withCheckIn(g, habitId, today(), delta));
        },

        addHabit(h) {
          update((g) => ({ ...g, habits: [...g.habits, { ...h, id: newId(), createdOn: today() }] }));
        },

        updateHabit(id, patch) {
          update((g) => ({ ...g, habits: g.habits.map((h) => (h.id === id ? { ...h, ...patch, target: Math.max(1, patch.target ?? h.target) } : h)) }));
        },

        archiveHabit(id) {
          const d = today();
          update((g) => ({
            ...g,
            // A habit added today and removed today never existed; otherwise keep its history.
            habits: g.habits.flatMap((h) => (h.id !== id ? [h] : h.createdOn === d ? [] : [{ ...h, archivedOn: d }])),
          }));
        },

        spend(kind) {
          update((g) => ({ ...g, events: [...g.events, { type: kind, date: today(), cost: COSTS[kind] }] }));
        },

        recordGameScore(score) {
          update((g) => {
            const i = g.events.map((e) => e.type).lastIndexOf('game');
            if (i < 0) return g;
            const events = g.events.slice();
            events[i] = { ...events[i], score };
            return { ...g, events };
          });
        },

        recordPet() {
          // Only the first ten pets matter (for a memory), so the log stays small.
          update((g) =>
            g.events.filter((e) => e.type === 'pet').length >= 10
              ? g
              : { ...g, events: [...g.events, { type: 'pet', date: today(), cost: 0 }] },
          );
        },

        renamePet(name) {
          update((g) => ({ ...g, pet: { ...g.pet, name } }));
        },

        setDayOffset(n) {
          set({ settings: { ...get().settings, dayOffset: n } });
        },

        loadScenario(id) {
          const g = get().game;
          if (!g) return;
          const habits = g.habits.filter((h) => !h.archivedOn);
          if (habits.length === 0) return;
          set({ game: buildScenario(id, g.pet, habits, today()) });
        },

        reset() {
          set({ game: null, settings: { dayOffset: 0 } });
        },
      };
    },
    {
      name: 'pawgress',
      version: 1,
      storage: createJSONStorage(() => {
        try {
          return window.localStorage;
        } catch {
          return sessionStorage;
        }
      }),
    },
  ),
);

export type { HabitIcon };
