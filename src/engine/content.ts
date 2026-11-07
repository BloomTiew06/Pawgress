import type { MemoryId } from './rules';
import type { HabitIcon, Mood, Stage } from './types';

export interface HabitPreset {
  key: string;
  name: string;
  icon: HabitIcon;
  target: number;
  unit: string;
}

export const HABIT_PRESETS: HabitPreset[] = [
  { key: 'water', name: 'Drink water', icon: 'water', target: 8, unit: 'glasses' },
  { key: 'study', name: 'Study session', icon: 'pencil', target: 2, unit: 'sessions' },
  { key: 'move', name: 'Exercise', icon: 'run', target: 1, unit: 'workout' },
  { key: 'read', name: 'Read', icon: 'book', target: 1, unit: 'chapter' },
  { key: 'sleep', name: 'In bed by 11', icon: 'moon', target: 1, unit: 'night' },
  { key: 'stretch', name: 'Stretch', icon: 'leaf', target: 1, unit: 'stretch' },
  { key: 'fruit', name: 'Eat fruit', icon: 'apple', target: 2, unit: 'pieces' },
  { key: 'outside', name: 'Go outside', icon: 'sun', target: 1, unit: 'walk' },
];

export const HABIT_ICONS: HabitIcon[] = ['water', 'pencil', 'run', 'book', 'moon', 'leaf', 'apple', 'sun', 'heart', 'star'];

export const MOOD_LABEL: Record<Mood, string> = {
  thriving: 'Thriving',
  okay: 'Doing okay',
  sad: 'Missing you',
};

export const STAGE_LABEL: Record<Stage, string> = {
  baby: 'Baby',
  kid: 'Kid',
  teen: 'Teen',
  grown: 'Grown',
};

export interface MemoryInfo {
  id: MemoryId;
  title: string;
  caption: string;
  hint: string;
  /** How the pet is drawn on the scrapbook page. */
  pose: { mood: Mood; stage?: Stage; prop?: 'star' | 'heart' | 'ball' | 'water' | 'sun' };
}

export const MEMORIES: MemoryInfo[] = [
  { id: 'first-step', title: 'The first step', caption: 'The very first check-in. Everything starts here.', hint: 'Log any habit', pose: { mood: 'okay', stage: 'baby', prop: 'water' } },
  { id: 'full-day', title: 'A whole day', caption: 'Every habit done in one day.', hint: 'Finish all habits in a day', pose: { mood: 'thriving', stage: 'baby', prop: 'sun' } },
  { id: 'kid', title: 'Growing up', caption: 'Three good days, and suddenly a kid.', hint: 'Reach 3 good days', pose: { mood: 'thriving', stage: 'kid' } },
  { id: 'week-streak', title: 'Seven in a row', caption: 'A full week of good days, back to back.', hint: 'Have 7 good days in a row', pose: { mood: 'thriving', prop: 'star' } },
  { id: 'teen', title: 'Teen years', caption: 'Ten good days. Taller, and a bit dramatic.', hint: 'Reach 10 good days', pose: { mood: 'thriving', stage: 'teen' } },
  { id: 'welcome-back', title: 'Welcome back', caption: 'A quiet stretch, then you came home. That counts too.', hint: 'Come back after a break', pose: { mood: 'thriving', prop: 'heart' } },
  { id: 'first-play', title: 'Playtime', caption: 'The first toy, the first game.', hint: 'Spend treats on play', pose: { mood: 'thriving', prop: 'ball' } },
  { id: 'gentle-paws', title: 'Gentle paws', caption: 'Ten pets. Someone feels very loved.', hint: 'Pet your friend 10 times', pose: { mood: 'thriving', prop: 'heart' } },
  { id: 'fifty-check-ins', title: 'Fifty check-ins', caption: 'Fifty little taps that added up.', hint: 'Log 50 check-ins', pose: { mood: 'thriving', prop: 'star' } },
  { id: 'star-catcher', title: 'Star catcher', caption: 'Fifteen stars caught in one game.', hint: 'Catch 15 stars in Starfall', pose: { mood: 'thriving', prop: 'star' } },
  { id: 'grown', title: 'All grown up', caption: 'Twenty-one good days. Look at them now.', hint: 'Reach 21 good days', pose: { mood: 'thriving', stage: 'grown' } },
];
