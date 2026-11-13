import { ArrowRight, Check, Crown, Flame, Home, RotateCcw, Target, Trophy, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { Show } from '../lib/data';
import { numberText } from '../lib/data';
import type { Game } from '../lib/game';
import type { Stats } from '../lib/storage';
import { Ranking } from './Ranking';
export function Results({
  game: g,
  stats,
  shows,
  newRecord,
  onPlay,
  onHome,
}: {
  game: Game;
  stats: Stats;
  shows: Show[];
  newRecord: boolean;
  onPlay: () => void;
  onHome: () => void;
}) {
  const accuracy = Math.round((g.correct / (g.correct + g.mistakes || 1)) * 100);
  return (
    <>
      <section className="results">
        <div className="result-medal">
          <Trophy size={34} />
        </div>
        <span className="eyebrow">ЭТО БЫЛ ДОСТОЙНЫЙ БАТТЛ</span>
        <h1>
          ИГРА <span className="accent">ОКОНЧЕНА</span>
        </h1>
        {newRecord && (
          <motion.div className="new-record" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            <Crown size={17} />
            НОВЫЙ РЕКОРД!
          </motion.div>
        )}
        <motion.div
          className="final-score"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <strong>{numberText(g.score)}</strong>
          <span>ИТОГОВЫЕ ОЧКИ</span>
        </motion.div>
        <p className="result-message">
          {g.score >= 5000
            ? 'Настоящий эксперт Кинопоиска!'
            : g.correct >= 15
              ? 'Ты отлично разбираешься в сериалах!'
              : g.correct >= 5
                ? 'Хорошая интуиция. Дальше — больше!'
                : 'Неплохое начало! Следующий рекорд уже близко.'}
        </p>
        <div className="result-stats">
          <div>
            <Trophy />
            <strong>{numberText(stats.best)}</strong>
            <small>Личный рекорд</small>
          </div>
          <div>
            <Check />
            <strong>{g.correct}</strong>
            <small>Правильные ответы</small>
          </div>
          <div>
            <X />
            <strong>{g.mistakes}</strong>
            <small>Ошибки</small>
          </div>
          <div>
            <Flame />
            <strong>{g.maxCombo}</strong>
            <small>Максимальное комбо</small>
          </div>
          <div>
            <Target />
            <strong>{accuracy}%</strong>
            <small>Точность</small>
          </div>
        </div>
        <div className="results-actions">
          <button className="button primary" onClick={onPlay}>
            <RotateCcw size={19} />
            СЫГРАТЬ ЕЩЁ
            <ArrowRight size={19} />
          </button>
          <button className="button outline" onClick={onHome}>
            <Home size={18} />
            НА ГЛАВНУЮ
          </button>
        </div>
      </section>
      <div className="results-divider">
        <span>СРАВНИ СВОЮ ИНТУИЦИЮ С ФАКТАМИ</span>
      </div>
      <Ranking shows={shows} />
    </>
  );
}
