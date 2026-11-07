import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Field, PetPicture } from '../components/ui';
import { HABIT_PRESETS } from '../engine/content';
import { ANIMALS, animalInfo } from '../engine/personality';
import type { AnimalId } from '../engine/types';
import { useStore } from '../store';

type Step = 'animal' | 'name' | 'habits';

const MAX_HABITS = 5;

export function Onboarding() {
  const adopt = useStore((s) => s.adopt);
  const [step, setStep] = useState<Step>('animal');
  const [animal, setAnimal] = useState<AnimalId>('cat');
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<Record<string, number>>({ water: 8, study: 2, move: 1 });

  const info = animalInfo(animal);
  const pickedKeys = Object.keys(picked);
  const toggle = (key: string, target: number) =>
    setPicked((p) => {
      const next = { ...p };
      if (key in next) delete next[key];
      else if (Object.keys(next).length < MAX_HABITS) next[key] = target;
      return next;
    });

  const finish = () => {
    adopt(
      animal,
      name.trim() || info.suggestedNames[0],
      HABIT_PRESETS.filter((p) => p.key in picked).map((p) => ({ name: p.name, icon: p.icon, target: picked[p.key] })),
    );
    location.hash = '#today';
  };

  return (
    <main className="onboarding">
      <header className="onboarding__brand">
        <span className="wordmark">Pawgress</span>
        <ol className="steps" aria-label="Setup progress">
          {(['animal', 'name', 'habits'] as Step[]).map((s, i) => (
            <li key={s} className={s === step ? 'is-current' : ''} aria-current={s === step ? 'step' : undefined}>
              {i + 1}. {s === 'animal' ? 'Friend' : s === 'name' ? 'Name' : 'Habits'}
            </li>
          ))}
        </ol>
      </header>

      {step === 'animal' && (
        <section className="onboarding__step">
          <h1>Who{'’'}s coming home with you?</h1>
          <p className="lede">Your friend grows when you keep your habits, and misses you when you don{'’'}t. It never runs away, and it{'’'}s always happy to see you come back.</p>
          <div className="animal-grid" role="radiogroup" aria-label="Choose an animal">
            {ANIMALS.map((a) => (
              <button
                key={a.id}
                role="radio"
                aria-checked={animal === a.id}
                className={`animal-card ${animal === a.id ? 'is-selected' : ''}`}
                onClick={() => setAnimal(a.id)}
              >
                <PetPicture animal={a.id} mood="thriving" stage="kid" size={112} />
                <span className="animal-card__name">{a.label}</span>
                <span className="animal-card__role">{a.role}</span>
                <span className="animal-card__blurb">{a.blurb}</span>
              </button>
            ))}
          </div>
          <div className="onboarding__actions">
            <Button variant="primary" size="lg" onClick={() => setStep('name')}>Choose the {info.label.toLowerCase()}</Button>
          </div>
        </section>
      )}

      {step === 'name' && (
        <section className="onboarding__step onboarding__step--narrow">
          <PetPicture animal={animal} mood="thriving" stage="baby" face="joy" size={150} />
          <h1>What{'’'}s their name?</h1>
          <Field label="Name">
            <input
              id="pet-name"
              className="input"
              value={name}
              maxLength={20}
              placeholder={info.suggestedNames[0]}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setStep('habits')}
              autoFocus
            />
          </Field>
          <div className="suggestions" aria-label="Name ideas">
            {info.suggestedNames.map((n) => (
              <button key={n} className="chip chip--button" onClick={() => setName(n)}>{n}</button>
            ))}
          </div>
          <div className="onboarding__actions">
            <Button variant="ghost" onClick={() => setStep('animal')}>Back</Button>
            <Button variant="primary" size="lg" onClick={() => setStep('habits')}>Next</Button>
          </div>
        </section>
      )}

      {step === 'habits' && (
        <section className="onboarding__step onboarding__step--narrow">
          <h1>Pick a few habits</h1>
          <p className="lede">Start small. Up to {MAX_HABITS} for now, and you can change them any time.</p>
          <ul className="preset-list">
            {HABIT_PRESETS.map((p) => {
              const on = p.key in picked;
              const full = !on && pickedKeys.length >= MAX_HABITS;
              return (
                <li key={p.key} className={`preset ${on ? 'is-on' : ''}`}>
                  <button className="preset__toggle" onClick={() => toggle(p.key, p.target)} aria-pressed={on} disabled={full}>
                    <span className="habit__icon"><Icon name={p.icon} size={22} /></span>
                    <span className="preset__name">{p.name}</span>
                    <span className="preset__check" aria-hidden="true">{on && <Icon name="check" size={18} />}</span>
                  </button>
                  {on && (
                    <span className="stepper" aria-label={`${p.name} daily target`}>
                      <button onClick={() => setPicked((x) => ({ ...x, [p.key]: Math.max(1, x[p.key] - 1) }))} aria-label="Fewer">
                        <Icon name="minus" size={16} />
                      </button>
                      <span>{picked[p.key]} a day</span>
                      <button onClick={() => setPicked((x) => ({ ...x, [p.key]: Math.min(20, x[p.key] + 1) }))} aria-label="More">
                        <Icon name="plus" size={16} />
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="onboarding__actions">
            <Button variant="ghost" onClick={() => setStep('name')}>Back</Button>
            <Button variant="primary" size="lg" icon="paw" onClick={finish} disabled={pickedKeys.length === 0}>
              Bring {name.trim() || info.suggestedNames[0]} home
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
