import { describe, expect, it } from 'vitest';
import { moodLevel, reactionForCheckIn, stageProgress, treatBalance } from './rules';
import { buildScenario } from './scenarios';
import type { Habit, Pet } from './types';

const TODAY = '2026-11-20';
const pet: Pet = { animal: 'pup', name: 'Biscuit', adoptedOn: TODAY };
const habits: Habit[] = [
  { id: 'w', name: 'Water', icon: 'water', target: 8, createdOn: TODAY },
  { id: 's', name: 'Study', icon: 'pencil', target: 2, createdOn: TODAY },
  { id: 'e', name: 'Exercise', icon: 'run', target: 1, createdOn: TODAY },
];

describe('demo scenarios match their descriptions', () => {
  it('thriving: a happy teen with treats', () => {
    const s = buildScenario('thriving', pet, habits, TODAY);
    expect(moodLevel(s, TODAY)).toBe('thriving');
    expect(stageProgress(s, TODAY).stage).toBe('teen');
    expect(treatBalance(s, TODAY)).toBeGreaterThan(3);
  });

  it('lapsed: sad, and the next check-in is a welcome back', () => {
    const s = buildScenario('lapsed', pet, habits, TODAY);
    expect(moodLevel(s, TODAY)).toBe('sad');
    expect(reactionForCheckIn(s, 'w', TODAY)).toBe('welcomeBack');
  });

  it('almostGrown: one check-in away from Grown', () => {
    const s = buildScenario('almostGrown', pet, habits, TODAY);
    expect(stageProgress(s, TODAY).stage).toBe('teen');
    expect(stageProgress(s, TODAY).goodDays).toBe(20);
    expect(habits.some((h) => reactionForCheckIn(s, h.id, TODAY) === 'stageUp')).toBe(true);
  });

  it('fresh: a new baby pet', () => {
    const s = buildScenario('fresh', pet, habits, TODAY);
    expect(stageProgress(s, TODAY).stage).toBe('baby');
    expect(moodLevel(s, TODAY)).toBe('okay');
  });
});
