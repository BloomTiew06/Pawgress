import { useEffect, useRef, useState } from 'react';
import { lineFor } from '../engine/personality';
import { COSTS } from '../engine/rules';
import type { AnimalId } from '../engine/types';
import { useReducedMotion } from '../hooks';
import { GAME_SECONDS, StarfallGame } from '../pet/StarfallGame';
import { Button, Sheet } from './ui';

interface Props {
  animal: AnimalId;
  petName: string;
  treats: number;
  /** Pay for a round. Returns false if there aren't enough treats. */
  onPay(): boolean;
  onFinish(score: number): void;
  onClose(): void;
}

type Phase = 'ready' | 'playing' | 'done';

export function StarfallModal({ animal, petName, treats, onPay, onFinish, onClose }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<StarfallGame | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(GAME_SECONDS);
  const [line, setLine] = useState('');
  const reduced = useReducedMotion();
  const finish = useRef(onFinish);
  finish.current = onFinish;

  useEffect(() => {
    let cancelled = false;
    StarfallGame.create(host.current!, animal, {
      onScore: setScore,
      onTime: setTime,
      onEnd: (s) => {
        setPhase('done');
        setLine(lineFor(animal, 'gameEnd', { score: s }));
        finish.current(s);
      },
    }, reduced).then((g) => {
      if (cancelled) g.destroy();
      else game.current = g;
    });
    return () => {
      cancelled = true;
      game.current?.destroy();
      game.current = null;
    };
  }, [animal, reduced]);

  const start = () => {
    if (!onPay()) return;
    setPhase('playing');
    game.current?.start();
    host.current?.focus();
  };

  const canPay = treats >= COSTS.game;

  return (
    <Sheet title="Starfall" onClose={onClose} wide>
      <div className="game">
        <div className="game__hud">
          <span><b>{score}</b> {score === 1 ? 'star' : 'stars'}</span>
          <span><b>{time}</b>s left</span>
        </div>
        <div className="game__field" ref={host} tabIndex={0} aria-label={`Game field. Move ${petName} with the arrow keys or your pointer.`} />
        {phase !== 'playing' && (
          <div className="game__overlay" aria-live="polite">
            {phase === 'ready' ? (
              <>
                <p className="game__title">Help {petName} catch falling stars</p>
                <p>Move with your finger, mouse or the arrow keys. Gold stars are worth 3. You have {GAME_SECONDS} seconds.</p>
              </>
            ) : (
              <>
                <p className="game__title">{score} {score === 1 ? 'star' : 'stars'}!</p>
                <p className="game__line">{petName}: {'“'}{line}{'”'}</p>
              </>
            )}
            <div className="row">
              <Button variant="primary" size="lg" icon="star" onClick={start} disabled={!canPay} badge={`${COSTS.game} treats`}>
                {phase === 'ready' ? 'Play' : 'Play again'}
              </Button>
              {phase === 'done' && <Button variant="ghost" onClick={onClose}>Done</Button>}
            </div>
            {!canPay && <p className="hint">You have {treats} {treats === 1 ? 'treat' : 'treats'}. Finish a habit to earn more.</p>}
          </div>
        )}
      </div>
    </Sheet>
  );
}
