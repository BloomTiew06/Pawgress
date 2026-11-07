import { propSvg } from '../art/props';
import { Icon } from '../components/Icon';
import { PetPicture } from '../components/ui';
import { MEMORIES } from '../engine/content';
import { formatDay } from '../engine/dates';
import type { GameState } from '../engine/types';
import { useDerived, useToday } from '../hooks';

export function Scrapbook({ game }: { game: GameState }) {
  const today = useToday();
  const { memories, progress } = useDerived(game, today);
  const found = new Map(memories.map((m) => [m.id, m.date]));
  const { pet } = game;

  return (
    <main className="scrapbook">
      <header className="page-head">
        <h1>{pet.name}{'’'}s scrapbook</h1>
        <p className="lede">Little moments from your days together. {found.size} of {MEMORIES.length} collected.</p>
      </header>
      <ul className="memory-grid">
        {MEMORIES.map((m) => {
          const date = found.get(m.id);
          if (!date) {
            return (
              <li key={m.id} className="memory memory--locked">
                <span className="memory__art memory__art--locked"><Icon name="lock" size={26} /></span>
                <h2>{m.title}</h2>
                <p className="memory__hint">{m.hint}</p>
              </li>
            );
          }
          return (
            <li key={m.id} className="memory">
              <span className="memory__art">
                <PetPicture animal={pet.animal} mood={m.pose.mood} stage={m.pose.stage ?? progress.stage} face={m.pose.mood === 'thriving' ? 'joy' : undefined} size={120} />
                {m.pose.prop && <span className="memory__prop" dangerouslySetInnerHTML={{ __html: propSvg(m.pose.prop, 40) }} />}
              </span>
              <h2>{m.title}</h2>
              <time dateTime={date}>{formatDay(date)}</time>
              <p>{m.caption}</p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
