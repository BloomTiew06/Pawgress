import { useEffect, useState } from 'react';
import { Icon, type IconName } from './components/Icon';
import { Habits } from './screens/Habits';
import { Onboarding } from './screens/Onboarding';
import { Scrapbook } from './screens/Scrapbook';
import { Settings } from './screens/Settings';
import { Today } from './screens/Today';
import { useStore } from './store';

type Tab = 'today' | 'scrapbook' | 'habits' | 'preferences';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'paw' },
  { id: 'scrapbook', label: 'Scrapbook', icon: 'scrapbook' },
  { id: 'habits', label: 'Habits', icon: 'list' },
  { id: 'preferences', label: 'Settings', icon: 'gear' },
];

function readTab(): Tab {
  const h = location.hash.slice(1);
  return (TABS.some((t) => t.id === h) ? h : 'today') as Tab;
}

export function App() {
  const game = useStore((s) => s.game);
  const [tab, setTab] = useState<Tab>(readTab);

  useEffect(() => {
    const onHash = () => setTab(readTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  if (!game) return <Onboarding />;

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <span className="wordmark">Pawgress</span>
        <nav className="tabs" aria-label="Main">
          {TABS.map((t) => (
            <a key={t.id} href={`#${t.id}`} className={`tab ${tab === t.id ? 'is-current' : ''}`} aria-current={tab === t.id ? 'page' : undefined}>
              <Icon name={t.icon} size={22} />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
      </header>
      <div id="main" className="content">
        {tab === 'today' && <Today game={game} />}
        {tab === 'scrapbook' && <Scrapbook game={game} />}
        {tab === 'habits' && <Habits game={game} />}
        {tab === 'preferences' && <Settings game={game} />}
      </div>
    </div>
  );
}
