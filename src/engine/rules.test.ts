import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import {
  dayScore, goodDayCount, missedDays, moodLevel, moodValue, reactionForCheckIn,
  stageFor, stageProgress, streak, treatBalance, unlockedMemories,
} from './rules';
import type { GameState, HabitLog } from './types';

const START = '2026-11-01';

function state(log: HabitLog = {}, extra: Partial<GameState> = {}): GameState {
  return {
    pet: { animal: 'cat', name: 'Miso', adoptedOn: START },
    habits: [
      { id: 'water', name: 'Drink water', icon: 'water', target: 4, createdOn: START },
      { id: 'study', name: 'Study', icon: 'pencil', target: 1, createdOn: START },
    ],
    log,
    events: [],
    ...extra,
  };
}

/** Log both habits fully for `days` days starting at START. */
function fullDays(days: number, from = START): HabitLog {
  const log: HabitLog = {};
  for (let i = 0; i < days; i++) log[addDays(from, i)] = { water: 4, study: 1 };
  return log;
}

describe('dayScore', () => {
  it('averages capped progress across active habits', () => {
    const s = state({ [START]: { water: 2, study: 0 } });
    expect(dayScore(s, START)).toBeCloseTo(0.25);
  });

  it('caps over-achievement at 100% per habit', () => {
    const s = state({ [START]: { water: 10, study: 0 } });
    expect(dayScore(s, START)).toBeCloseTo(0.5);
  });

  it('ignores habits created later or already archived', () => {
    const s = state({ [START]: { water: 4 } });
    s.habits[1].createdOn = addDays(START, 1);
    expect(dayScore(s, START)).toBe(1);
    s.habits[1].createdOn = START;
    s.habits[1].archivedOn = START;
    expect(dayScore(s, START)).toBe(1);
  });

  it('returns null when there are no active habits', () => {
    expect(dayScore(state({}, { habits: [] }), START)).toBeNull();
  });
});

describe('mood', () => {
  it('starts a newly adopted pet at "okay"', () => {
    expect(moodLevel(state(), START)).toBe('okay');
  });

  it('is thriving after a run of full days', () => {
    const today = addDays(START, 6);
    expect(moodLevel(state(fullDays(6)), today)).toBe('thriving');
  });

  it('drops to sad after three missed days', () => {
    const today = addDays(START, 8);
    // five good days, then days 5,6,7 missed, today untouched
    expect(missedDays(state(fullDays(5)), today)).toBe(3);
    expect(moodLevel(state(fullDays(5)), today)).toBe('sad');
  });

  it('recovers right away when you act today (never punishes coming back)', () => {
    const today = addDays(START, 8);
    const log = { ...fullDays(5), [today]: { water: 4, study: 1 } };
    expect(moodLevel(state(log), today)).toBe('thriving');
  });

  it('does not count today as a missed day before it is over', () => {
    const today = addDays(START, 3);
    expect(missedDays(state(fullDays(3)), today)).toBe(0);
    expect(moodValue(state(fullDays(3)), today)).toBeGreaterThanOrEqual(70);
  });
});

describe('growth', () => {
  it('maps good days to stages', () => {
    expect(stageFor(0)).toBe('baby');
    expect(stageFor(3)).toBe('kid');
    expect(stageFor(10)).toBe('teen');
    expect(stageFor(21)).toBe('grown');
  });

  it('pauses on missed days but never goes backwards', () => {
    const log = fullDays(4);
    const later = addDays(START, 20);
    expect(goodDayCount(state(log), later)).toBe(4);
    expect(stageProgress(state(log), later).stage).toBe('kid');
  });

  it('reports progress toward the next stage', () => {
    const p = stageProgress(state(fullDays(5)), addDays(START, 4));
    expect(p).toMatchObject({ stage: 'kid', goodDays: 5, nextAt: 10, nextStage: 'teen' });
  });

  it('counts the current streak including today once it is good', () => {
    const today = addDays(START, 4);
    expect(streak(state(fullDays(4)), today)).toBe(4);
    expect(streak(state(fullDays(5)), today)).toBe(5);
  });
});

describe('treats', () => {
  it('earns one per finished habit plus a bonus for a full day, minus spending', () => {
    const log: HabitLog = { [START]: { water: 4, study: 1 }, [addDays(START, 1)]: { water: 4 } };
    const s = state(log, { events: [{ type: 'toy', date: addDays(START, 1), cost: 1 }] });
    expect(treatBalance(s, addDays(START, 1))).toBe(3 + 1 - 1);
  });
});

describe('reactions', () => {
  it('celebrates a return after missed days with welcomeBack', () => {
    const today = addDays(START, 8);
    expect(reactionForCheckIn(state(fullDays(5)), 'water', today)).toBe('welcomeBack');
  });

  it('distinguishes a tap, a finished habit and a finished day', () => {
    const today = START;
    expect(reactionForCheckIn(state(), 'water', today)).toBe('habitTap');
    expect(reactionForCheckIn(state({ [today]: { water: 3 } }), 'water', today)).toBe('habitDone');
    expect(reactionForCheckIn(state({ [today]: { water: 3, study: 1 } }), 'water', today)).toBe('dayDone');
  });

  it('prefers stageUp when a check-in crosses a growth threshold', () => {
    const today = addDays(START, 2);
    // two good days so far; finishing water today makes the third (Kid stage)
    const log = { ...fullDays(2), [today]: { water: 3 } };
    expect(reactionForCheckIn(state(log), 'water', today)).toBe('stageUp');
  });
});

describe('memories', () => {
  it('unlocks memories on the day they happened', () => {
    const today = addDays(START, 8);
    const log = { ...fullDays(7), [today]: { water: 1 } };
    const mem = Object.fromEntries(unlockedMemories(state(log), today).map((m) => [m.id, m.date]));
    expect(mem['first-step']).toBe(START);
    expect(mem['full-day']).toBe(START);
    expect(mem['kid']).toBe(addDays(START, 2));
    expect(mem['week-streak']).toBe(addDays(START, 6));
    expect(mem['welcome-back']).toBeUndefined();
  });

  it('records a welcome back after two or more quiet days', () => {
    const today = addDays(START, 7);
    const log = { ...fullDays(3), [today]: { study: 1 } };
    const ids = unlockedMemories(state(log), today).map((m) => m.id);
    expect(ids).toContain('welcome-back');
  });
});
