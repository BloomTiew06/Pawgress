import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Field, IconButton } from '../components/ui';
import { HABIT_ICONS, HABIT_PRESETS } from '../engine/content';
import type { GameState, Habit, HabitIcon } from '../engine/types';
import { useToday } from '../hooks';
import { useStore } from '../store';

interface Draft { name: string; icon: HabitIcon; target: number }

function HabitForm({ initial, submitLabel, onSubmit, onCancel }: { initial: Draft; submitLabel: string; onSubmit(d: Draft): void; onCancel(): void }) {
  const [d, setD] = useState(initial);
  const valid = d.name.trim().length > 0;
  return (
    <form
      className="habit-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit({ ...d, name: d.name.trim() });
      }}
    >
      <Field label="Habit">
        <input id="habit-name" className="input" value={d.name} maxLength={32} placeholder="Drink water" onChange={(e) => setD({ ...d, name: e.target.value })} autoFocus />
      </Field>
      <fieldset className="icon-picker">
        <legend className="field__label">Icon</legend>
        {HABIT_ICONS.map((icon) => (
          <label key={icon} className={`icon-choice ${d.icon === icon ? 'is-on' : ''}`}>
            <input type="radio" name="habit-icon" value={icon} checked={d.icon === icon} onChange={() => setD({ ...d, icon })} />
            <Icon name={icon} size={22} label={icon} />
          </label>
        ))}
      </fieldset>
      <Field label="Times a day" hint="Each tap counts once. The habit is done when you reach this number.">
        <span className="stepper stepper--lg">
          <button type="button" onClick={() => setD({ ...d, target: Math.max(1, d.target - 1) })} aria-label="Fewer"><Icon name="minus" size={18} /></button>
          <span aria-live="polite">{d.target}</span>
          <button type="button" onClick={() => setD({ ...d, target: Math.min(20, d.target + 1) })} aria-label="More"><Icon name="plus" size={18} /></button>
        </span>
      </Field>
      <div className="row">
        <Button type="submit" variant="primary" disabled={!valid}>{submitLabel}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function Habits({ game }: { game: GameState }) {
  const today = useToday();
  const addHabit = useStore((s) => s.addHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const archiveHabit = useStore((s) => s.archiveHabit);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState<Draft | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const habits = game.habits.filter((h) => !h.archivedOn || h.archivedOn > today);
  const unused = HABIT_PRESETS.filter((p) => !habits.some((h) => h.name === p.name));

  const row = (h: Habit) => {
    if (editing === h.id) {
      return (
        <li key={h.id} className="habit-edit">
          <HabitForm
            initial={{ name: h.name, icon: h.icon, target: h.target }}
            submitLabel="Save"
            onSubmit={(d) => {
              updateHabit(h.id, d);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </li>
      );
    }
    return (
      <li key={h.id} className="habit">
        <span className="habit__icon"><Icon name={h.icon} size={24} /></span>
        <div className="habit__body">
          <span className="habit__name">{h.name}</span>
          <span className="habit__count">{h.target} {h.target === 1 ? 'time' : 'times'} a day</span>
        </div>
        <div className="habit__actions">
          {confirming === h.id ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Keep</Button>
              <Button size="sm" variant="primary" icon="trash" onClick={() => { archiveHabit(h.id); setConfirming(null); }}>Remove</Button>
            </>
          ) : (
            <>
              <IconButton icon="edit" label={`Edit ${h.name}`} onClick={() => setEditing(h.id)} />
              <IconButton icon="trash" label={`Remove ${h.name}`} onClick={() => setConfirming(h.id)} />
            </>
          )}
        </div>
      </li>
    );
  };

  return (
    <main className="habits-screen">
      <header className="page-head">
        <h1>Habits</h1>
        <p className="lede">Removing a habit keeps its history, so past days still count toward {game.pet.name}{'’'}s growth.</p>
      </header>
      <ul className="habit-list">{habits.map(row)}</ul>
      {habits.length === 0 && <p className="empty">No habits right now. Add one below.</p>}

      {adding ? (
        <div className="card">
          <HabitForm
            initial={adding}
            submitLabel="Add habit"
            onSubmit={(d) => {
              addHabit(d);
              setAdding(null);
            }}
            onCancel={() => setAdding(null)}
          />
        </div>
      ) : (
        <section className="add-habit" aria-labelledby="add-title">
          <h2 id="add-title">Add a habit</h2>
          <div className="suggestions">
            {unused.map((p) => (
              <button key={p.key} className="chip chip--button" onClick={() => addHabit({ name: p.name, icon: p.icon, target: p.target })}>
                <Icon name={p.icon} size={16} /> {p.name}
              </button>
            ))}
          </div>
          <Button icon="plus" onClick={() => setAdding({ name: '', icon: 'star', target: 1 })}>Make your own</Button>
        </section>
      )}
    </main>
  );
}
