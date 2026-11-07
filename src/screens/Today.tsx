import { useCallback, useEffect, useRef, useState } from 'react';
import { DemoPanel } from '../components/DemoPanel';
import { Icon } from '../components/Icon';
import { PetCanvas, type PetCanvasHandle } from '../components/PetCanvas';
import { StarfallModal } from '../components/StarfallModal';
import { Button, Chip, Meter, ProgressDots } from '../components/ui';
import { HABIT_PRESETS, MOOD_LABEL, STAGE_LABEL } from '../engine/content';
import { animalInfo, lineFor } from '../engine/personality';
import { COSTS, activeHabits, countFor, greetingFor, reactionForCheckIn } from '../engine/rules';
import type { GameState, ReactionKind } from '../engine/types';
import { useDerived, useToday } from '../hooks';
import { useStore } from '../store';
import type { ToyId } from '../pet/PetStage';

export function Today({ game }: { game: GameState }) {
  const today = useToday();
  const d = useDerived(game, today);
  const { pet } = game;
  const info = animalInfo(pet.animal);
  const checkIn = useStore((s) => s.checkIn);
  const spend = useStore((s) => s.spend);
  const recordPet = useStore((s) => s.recordPet);
  const recordGameScore = useStore((s) => s.recordGameScore);
  const canvas = useRef<PetCanvasHandle>(null);
  const [line, setLine] = useState('');
  const [lineKey, setLineKey] = useState(0);
  const [gameOpen, setGameOpen] = useState(false);

  const say = useCallback((kind: ReactionKind, vars?: Record<string, string | number>) => {
    setLine(lineFor(pet.animal, kind, vars));
    setLineKey((k) => k + 1);
  }, [pet.animal]);

  // Greet on arrival, after time travel, and when the mood shifts on its own.
  // A mood change caused by a check-in keeps the check-in's line instead.
  const lastAction = useRef(0);
  const [jumps, setJumps] = useState(0);
  const greetKey = `${today}|${d.mood}|${pet.animal}|${jumps}`;
  const greeted = useRef('');
  useEffect(() => {
    if (greeted.current === greetKey) return;
    greeted.current = greetKey;
    if (Date.now() - lastAction.current < 2000) return;
    const kind = greetingFor(d.mood);
    say(kind);
    canvas.current?.react(kind);
  }, [greetKey, d.mood, say]);
  const acted = () => (lastAction.current = Date.now());

  const habits = activeHabits(game, today);

  const onCheckIn = (habitId: string) => {
    const kind = reactionForCheckIn(game, habitId, today);
    acted();
    checkIn(habitId, 1);
    canvas.current?.react(kind);
    say(kind);
  };

  const onPet = () => {
    acted();
    recordPet();
    canvas.current?.react('petted');
    say('petted');
  };

  const onToy = (toy: ToyId) => {
    if (d.treats < COSTS.toy) return;
    acted();
    spend('toy');
    canvas.current?.playToy(toy);
    say('toy');
  };

  const unitFor = (name: string) => HABIT_PRESETS.find((p) => p.name === name)?.unit;
  const next = d.progress.nextAt;
  const stageFraction = next ? (d.progress.goodDays - d.progress.prevAt) / (next - d.progress.prevAt) : 1;

  return (
    <div className="today">
      <section className="pet-panel" aria-label={`${pet.name}, your ${info.label.toLowerCase()}`}>
        <header className="pet-panel__head">
          <div>
            <h1 className="pet-name">{pet.name}</h1>
            <p className="pet-role">{info.label}, {info.role}</p>
          </div>
          <div className="pet-panel__chips">
            <Chip tone={d.mood}>{MOOD_LABEL[d.mood]}</Chip>
            <Chip tone="treat" icon="treat">{d.treats} {d.treats === 1 ? 'treat' : 'treats'}</Chip>
          </div>
        </header>

        <div className="stage-card">
          <p className="speech" aria-live="polite" key={lineKey}>
            <span className="visually-hidden">{pet.name} says: </span>
            {line}
          </p>
          <PetCanvas
            ref={canvas}
            view={{ animal: pet.animal, mood: d.mood, stage: d.progress.stage }}
            label={`${pet.name} the ${info.label.toLowerCase()}, ${STAGE_LABEL[d.progress.stage].toLowerCase()} stage, ${MOOD_LABEL[d.mood].toLowerCase()}. Tap to pet.`}
            onPet={onPet}
          />
        </div>

        <div className="growth">
          <div className="growth__row">
            <span className="growth__stage">{STAGE_LABEL[d.progress.stage]}</span>
            <span className="growth__detail">
              {next
                ? `${d.progress.goodDays} of ${next} good days to ${STAGE_LABEL[d.progress.nextStage!]}`
                : `${d.progress.goodDays} good days together`}
            </span>
            {d.streak > 1 && <span className="growth__streak"><Icon name="flame" size={16} /> {d.streak} in a row</span>}
          </div>
          <Meter value={stageFraction} label="Growth toward next stage" />
        </div>

        <div className="play" role="group" aria-label="Play">
          <Button icon="paw" onClick={onPet}>Pet</Button>
          <Button icon="ball" onClick={() => onToy('ball')} disabled={d.treats < COSTS.toy} badge={COSTS.toy}>Ball</Button>
          <Button icon="bubbles" onClick={() => onToy('bubbles')} disabled={d.treats < COSTS.toy} badge={COSTS.toy}>Bubbles</Button>
          <Button icon="star" variant="celebrate" onClick={() => setGameOpen(true)} badge={COSTS.game}>Starfall</Button>
        </div>
        {d.treats < COSTS.toy && <p className="hint">Toys and games cost treats. Finish a habit to earn one. Petting is always free.</p>}
      </section>

      <section className="habits-panel" aria-labelledby="habits-title">
        <div className="section-title">
          <h2 id="habits-title">Today{"’"}s habits</h2>
          <span className="muted">{habits.filter((h) => countFor(game, h.id, today) >= h.target).length} of {habits.length} done</span>
        </div>
        {habits.length === 0 && <p className="empty">No habits yet. Add one on the Habits tab and {pet.name} will start growing.</p>}
        <ul className="habit-list">
          {habits.map((h) => {
            const n = countFor(game, h.id, today);
            const done = n >= h.target;
            const unit = unitFor(h.name);
            return (
              <li key={h.id} className={`habit ${done ? 'habit--done' : ''}`}>
                <span className="habit__icon"><Icon name={h.icon} size={24} /></span>
                <div className="habit__body">
                  <span className="habit__name">{h.name}</span>
                  <span className="habit__count">
                    <ProgressDots done={n} target={h.target} />
                    <span>{n} of {h.target}{unit && h.target > 1 ? ` ${unit}` : ''}</span>
                  </span>
                </div>
                <div className="habit__actions">
                  {n > 0 && (
                    <button className="icon-btn icon-btn--quiet" onClick={() => checkIn(h.id, -1)} aria-label={`Undo one ${h.name}`}>
                      <Icon name="minus" size={18} />
                    </button>
                  )}
                  <button className={`tap ${done ? 'tap--done' : ''}`} onClick={() => onCheckIn(h.id)} aria-label={`Log ${h.name}, ${n} of ${h.target} so far`}>
                    <Icon name={done ? 'check' : 'plus'} size={22} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <DemoPanel onJump={() => { lastAction.current = 0; setJumps((n) => n + 1); }} />
      </section>

      {gameOpen && (
        <StarfallModal
          animal={pet.animal}
          petName={pet.name}
          treats={d.treats}
          onPay={() => {
            if (d.treats < COSTS.game) return false;
            spend('game');
            return true;
          }}
          onFinish={(score) => {
            recordGameScore(score);
          }}
          onClose={() => {
            setGameOpen(false);
            canvas.current?.react('gameEnd');
          }}
        />
      )}
    </div>
  );
}
