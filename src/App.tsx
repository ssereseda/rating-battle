import { useEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Film,
  Gamepad2,
  LoaderCircle,
  Medal,
  RefreshCw,
  Trophy,
  Zap,
} from 'lucide-react';
import type { Show } from './lib/data';
import { loadShows } from './lib/data';
import { createReducer } from './lib/appState';
import { readStats, saveStats } from './lib/storage';
import { achievements } from './lib/achievements';
import { Modal } from './components/Modal';
import { Home } from './components/Home';
import { Rules, AchievementPanel } from './components/Panels';
import { GameScreen } from './components/GameScreen';
import { Results } from './components/Results';
type Panel = 'rules' | 'achievements' | 'exit' | null;
function Toast({ id, onDismiss }: { id: string; onDismiss: () => void }) {
  const item = achievements.find((a) => a.id === id)!;
  const callback = useRef(onDismiss);
  callback.current = onDismiss;
  useEffect(() => {
    const timer = setTimeout(() => callback.current(), 4500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <motion.div
      role="status"
      className="toast"
      initial={{ opacity: 0, y: -25, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
    >
      <span className="toast-icon">
        <item.icon />
      </span>
      <div>
        <small>ДОСТИЖЕНИЕ ОТКРЫТО!</small>
        <strong>{item.title}</strong>
      </div>
      <button aria-label="Закрыть уведомление" onClick={onDismiss}>
        <Check size={18} />
      </button>
    </motion.div>
  );
}
function LoadedApp({ shows }: { shows: Show[] }) {
  const [state, dispatch] = useReducer(createReducer(shows), undefined, () => ({
    screen: 'home' as const,
    game: null,
    stats: readStats(),
    newRecord: false,
    toasts: [],
  }));
  const [panel, setPanel] = useState<Panel>(null);
  const [storageOk, setStorageOk] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousScreen = useRef(state.screen);
  useEffect(() => {
    setStorageOk(saveStats(state.stats));
  }, [state.stats]);
  useEffect(() => {
    if (previousScreen.current !== state.screen) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      contentRef.current?.focus();
      previousScreen.current = state.screen;
    }
  }, [state.screen]);
  useEffect(() => {
    if (state.game?.phase !== 'transition') return;
    const timer = setTimeout(() => dispatch({ type: 'ready' }), 320);
    return () => clearTimeout(timer);
  }, [state.game?.phase, state.game?.right.id]);
  const play = () => {
    setPanel(null);
    dispatch({ type: 'start' });
  };
  const home = () => {
    if (state.screen === 'game') setPanel('exit');
    else dispatch({ type: 'home' });
  };
  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={home} aria-label="Рейтинг-баттл — на главную">
          <span className="brand-icon">
            <Zap fill="currentColor" size={21} />
          </span>
          <span>
            РЕЙТИНГ<span className="brand-dash">–</span>БАТТЛ<small>СЕРИАЛЫ РЕШАЮТ</small>
          </span>
        </button>
        <nav aria-label="Основная навигация">
          {state.screen === 'game' ? (
            <button className="header-exit" onClick={() => setPanel('exit')}>
              <ArrowLeft size={16} />
              <span>На главную</span>
            </button>
          ) : (
            <>
              <button
                className="nav-link"
                aria-label="Как играть"
                onClick={() => setPanel('rules')}
              >
                <Gamepad2 size={17} />
                <span>Как играть</span>
              </button>
              <button
                className="nav-link"
                aria-label="Достижения"
                onClick={() => setPanel('achievements')}
              >
                <Trophy size={17} />
                <span>Достижения</span>
              </button>
            </>
          )}
          <span className="dataset-badge">
            <span className="live-dot" />
            50 сериалов
          </span>
        </nav>
      </header>
      <main ref={contentRef} tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={state.screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {state.screen === 'home' && (
              <Home
                shows={shows}
                stats={state.stats}
                onPlay={play}
                onRules={() => setPanel('rules')}
                onAchievements={() => setPanel('achievements')}
              />
            )}{' '}
            {state.screen === 'game' && state.game && (
              <GameScreen
                game={state.game}
                onAnswer={(choice) => dispatch({ type: 'answer', choice })}
                onNext={() => dispatch({ type: 'next' })}
                onHint={() => dispatch({ type: 'hint' })}
                onSwap={() => dispatch({ type: 'swap' })}
              />
            )}{' '}
            {state.screen === 'results' && state.game && (
              <Results
                game={state.game}
                stats={state.stats}
                shows={shows}
                newRecord={state.newRecord}
                onPlay={play}
                onHome={home}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      {!storageOk && (
        <p className="storage-notice" role="status">
          Браузер запретил сохранение. Статистика доступна до закрытия страницы.
        </p>
      )}
      <footer className="site-footer">
        <div>
          <Film size={16} />
          <span>
            Игра создана на основе учебного датасета рейтингов Кинопоиска.
            <br />
            Рейтинги могут отличаться от актуальных.
          </span>
        </div>
        <span className="footer-right">
          СМОТРИ. СРАВНИВАЙ. ПОБЕЖДАЙ.
          <ArrowUpRight size={15} />
        </span>
      </footer>
      <AnimatePresence>
        {panel && (
          <Modal
            title={
              panel === 'rules'
                ? 'Как играть?'
                : panel === 'achievements'
                  ? 'Твои достижения'
                  : 'Завершить текущую игру?'
            }
            onClose={() => setPanel(null)}
            wide={panel === 'achievements'}
          >
            {panel === 'rules' ? (
              <Rules onPlay={state.screen === 'game' ? () => setPanel(null) : play} />
            ) : panel === 'achievements' ? (
              <>
                <AchievementPanel stats={state.stats} />
                <button className="button outline full" onClick={() => setPanel(null)}>
                  <ArrowLeft size={17} />
                  Назад
                </button>
              </>
            ) : (
              <>
                <p className="muted">
                  Текущий результат будет потерян. Незавершённая игра не засчитается в статистику
                  полных сессий.
                </p>
                <div className="exit-actions">
                  <button className="button primary" onClick={() => setPanel(null)}>
                    Остаться
                    <ArrowRight size={18} />
                  </button>
                  <button
                    className="button outline"
                    onClick={() => {
                      setPanel(null);
                      dispatch({ type: 'home' });
                    }}
                  >
                    Выйти
                  </button>
                </div>
              </>
            )}
          </Modal>
        )}
      </AnimatePresence>
      <div className="toast-stack">
        <AnimatePresence>
          {state.toasts.slice(0, 2).map((id) => (
            <Toast key={id} id={id} onDismiss={() => dispatch({ type: 'dismiss', id })} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
export default function App() {
  const [shows, setShows] = useState<Show[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError('');
    loadShows()
      .then((data) => {
        if (!cancelled) setShows(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не удалось прочитать CSV.');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  if (!shows)
    return (
      <div className="loading-screen">
        <span className="brand-icon">
          <Zap fill="currentColor" />
        </span>
        <h1>РЕЙТИНГ-БАТТЛ</h1>
        {error ? (
          <>
            <Medal className="pink-text" size={34} />
            <h2>Не удалось загрузить сериалы</h2>
            <p role="alert">{error}</p>
            <p className="muted">Проверь соединение и наличие исходного CSV в папке приложения.</p>
            <button className="button primary" onClick={() => setAttempt((a) => a + 1)}>
              <RefreshCw size={18} />
              Повторить попытку
            </button>
          </>
        ) : (
          <>
            <LoaderCircle className="spinner" />
            <p role="status">Собираем сериалы для баттла…</p>
          </>
        )}
      </div>
    );
  return <LoadedApp shows={shows} />;
}
