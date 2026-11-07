import { useState } from 'react';
import { DemoPanel } from '../components/DemoPanel';
import { Button, Field } from '../components/ui';
import { animalInfo } from '../engine/personality';
import { COSTS, STAGES } from '../engine/rules';
import type { GameState } from '../engine/types';
import { useStore } from '../store';

export function Settings({ game }: { game: GameState }) {
  const renamePet = useStore((s) => s.renamePet);
  const reset = useStore((s) => s.reset);
  const [name, setName] = useState(game.pet.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const info = animalInfo(game.pet.animal);

  return (
    <main className="settings">
      <header className="page-head">
        <h1>Settings</h1>
      </header>

      <section className="card">
        <h2>Your {info.label.toLowerCase()}</h2>
        <form
          className="row row--end"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) renamePet(name.trim());
          }}
        >
          <Field label="Name">
            <input id="rename" className="input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Button type="submit" disabled={!name.trim() || name.trim() === game.pet.name}>Rename</Button>
        </form>
      </section>

      <DemoPanel />

      <section className="card how">
        <h2>How Pawgress works</h2>
        <dl>
          <div><dt>Mood</dt><dd>Follows the last five days, with yesterday counting most. Anything you do today can only lift it, so opening the app and doing one small thing always helps.</dd></div>
          <div><dt>Missed days</dt><dd>A day under a quarter done counts as missed. After a few, your friend looks sad and its growth pauses. It never runs away and never shrinks.</dd></div>
          <div><dt>Growth</dt><dd>A good day is one at least half done. {STAGES.slice(1).map((s) => `${s.at} good days for ${s.stage}`).join(', ')}.</dd></div>
          <div><dt>Treats</dt><dd>One for each habit you finish, plus a bonus for finishing them all. A toy costs {COSTS.toy}, a game of Starfall costs {COSTS.game}. Petting is free.</dd></div>
          <div><dt>Your data</dt><dd>Everything stays in this browser on this device. There{'’'}s no account and nothing is sent anywhere.</dd></div>
        </dl>
      </section>

      <section className="card danger">
        <h2>Start over</h2>
        <p>Removes {game.pet.name}, your habits and all history from this device.</p>
        {confirmReset ? (
          <div className="row">
            <Button variant="primary" onClick={() => { reset(); location.hash = ''; }}>Yes, start over</Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Keep everything</Button>
          </div>
        ) : (
          <Button onClick={() => setConfirmReset(true)}>Start over</Button>
        )}
      </section>
    </main>
  );
}
