import { useEffect, useMemo, useState } from 'react';
import {
  missedDays, moodFromValue, moodValue, stageProgress, streak, treatBalance, unlockedMemories,
} from './engine/rules';
import type { GameState } from './engine/types';
import { todayFor, useStore } from './store';

export function useToday() {
  const dayOffset = useStore((s) => s.settings.dayOffset);
  // Re-render after midnight so "today" stays true.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return todayFor({ dayOffset });
}

/** Everything the screens show about the pet, derived from the facts in the store. */
export function useDerived(game: GameState, today: string) {
  return useMemo(() => {
    const value = moodValue(game, today);
    return {
      moodValue: value,
      mood: moodFromValue(value),
      progress: stageProgress(game, today),
      streak: streak(game, today),
      treats: treatBalance(game, today),
      missed: missedDays(game, today),
      memories: unlockedMemories(game, today),
    };
  }, [game, today]);
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const fn = () => setReduced(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return reduced;
}
