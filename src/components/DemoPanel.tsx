/** Time travel for reviewers: see weeks of pet life in a couple of minutes. */
import { formatDay } from '../engine/dates';
import { SCENARIOS } from '../engine/scenarios';
import { useToday } from '../hooks';
import { useStore } from '../store';
import { Button } from './ui';

export function DemoPanel({ onJump }: { onJump?: () => void }) {
  const today = useToday();
  const offset = useStore((s) => s.settings.dayOffset);
  const setDayOffset = useStore((s) => s.setDayOffset);
  const loadScenario = useStore((s) => s.loadScenario);
  const jump = (fn: () => void) => {
    fn();
    onJump?.();
  };

  return (
    <section className="demo" aria-labelledby="demo-title">
      <div className="demo__head">
        <h2 id="demo-title">Time travel</h2>
        <span className="demo__date">
          {offset === 0 ? 'Today' : `${offset > 0 ? '+' : ''}${offset} ${Math.abs(offset) === 1 ? 'day' : 'days'}`} · {formatDay(today)}
        </span>
      </div>
      <p className="demo__note">For trying Pawgress quickly. Skip ahead to see how missed days feel, or load a ready-made history.</p>
      <div className="row">
        <Button size="sm" icon="clock" onClick={() => jump(() => setDayOffset(offset + 1))}>Skip a day</Button>
        {offset !== 0 && <Button size="sm" variant="ghost" onClick={() => jump(() => setDayOffset(0))}>Back to real today</Button>}
      </div>
      <div className="demo__scenarios">
        {SCENARIOS.map((s) => (
          <button key={s.id} className="scenario" onClick={() => jump(() => loadScenario(s.id))}>
            <b>{s.label}</b>
            <span>{s.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
