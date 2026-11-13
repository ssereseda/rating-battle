import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Flame,
  Heart,
  Lightbulb,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { numberText, ratingText } from '../lib/data';
import type { Game, Choice } from '../lib/game';
import { multiplier } from '../lib/game';
import { Poster } from './Poster';
export function GameScreen({
  game: g,
  onAnswer,
  onNext,
  onHint,
  onSwap,
}: {
  game: Game;
  onAnswer: (c: Choice) => void;
  onNext: () => void;
  onHint: () => void;
  onSwap: () => void;
}) {
  const revealed = g.phase === 'reveal' || g.phase === 'finished';
  const locked = g.phase !== 'answer';
  const result = g.last;
  const mult = multiplier(g.combo);
  return (
    <div className="game-screen">
      <div className="game-hud">
        <div className="hud-score">
          <small>ТВОИ ОЧКИ</small>
          <motion.strong key={g.score} initial={{ scale: 1.12 }} animate={{ scale: 1 }}>
            {numberText(g.score)}
          </motion.strong>
        </div>
        <div className={`hud-combo ${g.combo >= 3 ? 'combo-hot' : ''}`}>
          <Flame />
          <div>
            <small>КОМБО {g.combo}</small>
            <motion.strong key={mult} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>
              ×{String(mult).replace('.', ',')}
            </motion.strong>
          </div>
        </div>
        <div className="lives" aria-label={`Осталось жизней: ${g.lives}`}>
          <span className="shield-slot">
            {g.shield && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} aria-label="Щит активен">
                <ShieldCheck />
              </motion.span>
            )}
          </span>
          {[1, 2, 3].map((n) => (
            <motion.span
              key={n}
              animate={{ scale: n <= g.lives ? 1 : 0.85, opacity: n <= g.lives ? 1 : 0.25 }}
            >
              <Heart fill={n <= g.lives ? 'currentColor' : 'none'} />
            </motion.span>
          ))}
        </div>
      </div>
      <div className="game-question">
        <div className="eyebrow">РАУНД {g.correct + g.mistakes + (revealed ? 0 : 1)}</div>
        <h1>
          У второго сериала рейтинг
          <br /> <span className="lime">выше</span> или <span className="pink-text">ниже</span>?
        </h1>
      </div>
      <div className="battle-field">
        <AnimatePresence initial={false} mode="popLayout">
          {[g.left, g.right].map((show, i) => (
            <motion.article
              layout
              key={`${i}-${show.id}`}
              initial={{ opacity: 0, x: 35 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -35 }}
              transition={{ duration: 0.3 }}
              className={`battle-card ${i === 1 ? 'mystery' : ''} ${i === 1 && revealed ? (result?.correct ? 'correct-card' : 'wrong-card') : ''}`}
            >
              <div className="card-overline">
                <span>0{i + 1}</span>
                {i === 0 ? 'РЕЙТИНГ ИЗВЕСТЕН' : revealed ? 'РЕЙТИНГ РАСКРЫТ' : 'ТВОЙ ВЫБОР'}
              </div>
              <div className="battle-card-body">
                <Poster show={show} />
                <div className="show-info">
                  <span className="show-years">{show.years}</span>
                  <h2>{show.title}</h2>
                  <span className="card-genre">{show.genre}</span>
                </div>
              </div>
              <div className="rating-zone">
                <small>РЕЙТИНГ КИНОПОИСКА</small>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.strong
                    key={i === 0 || revealed ? 'rating' : 'hidden'}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className={i === 1 && !revealed ? 'question-mark' : ''}
                  >
                    {i === 0 || revealed ? ratingText(show.rating) : '?'}
                  </motion.strong>
                </AnimatePresence>
                {i === 1 && !revealed ? (
                  <span className="rating-caption">Положись на свою интуицию</span>
                ) : (
                  <span className="rating-caption">
                    {revealed ? `${numberText(show.votes)} оценок` : 'По данным учебного датасета'}
                  </span>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
        <div className="battle-vs" aria-label="против">
          VS
        </div>
      </div>
      <div className="answer-area" aria-live="polite">
        {!revealed ? (
          <>
            <div className="answer-buttons">
              <button
                className="button primary"
                disabled={locked}
                onClick={() => onAnswer('higher')}
              >
                <ArrowUp />
                ВЫШЕ
              </button>
              <button
                className="button secondary"
                disabled={locked}
                onClick={() => onAnswer('lower')}
              >
                <ArrowDown />
                НИЖЕ
              </button>
            </div>
            <AnimatePresence>
              {g.hint && (
                <motion.div
                  className="hint-message"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Lightbulb size={18} />
                  Рейтинг находится между {ratingText(g.hint[0])} и {ratingText(g.hint[1])}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`round-result ${result?.correct ? 'success' : 'failure'}`}
          >
            <h2>
              {result?.correct ? (
                <>
                  <Check />
                  ВЕРНО! +{result.points} ОЧКОВ
                </>
              ) : result?.protected ? (
                <>
                  <ShieldCheck />
                  ЗАЩИТА СРАБОТАЛА!
                </>
              ) : (
                <>
                  <X />
                  НЕВЕРНО! −1 ЖИЗНЬ
                </>
              )}
            </h2>
            {result?.earnedShield && (
              <p className="lime">
                <ShieldCheck size={17} />
                ЩИТ ПОЛУЧЕН!
              </p>
            )}
            {result?.correct && g.combo >= 3 && (
              <motion.p className="combo-message" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                <Flame size={16} />
                КОМБО ×{String(mult).replace('.', ',')}! Серия: {g.combo}
              </motion.p>
            )}
            <div className="answer-details">
              <span>
                {g.right.years} · {numberText(g.right.votes)} оценок
              </span>
              <p>{g.right.description}</p>
              <a href={g.right.url} target="_blank" rel="noopener noreferrer">
                О сериале на Кинопоиске ↗
              </a>
            </div>
            <button className="button primary next-button" onClick={onNext}>
              {g.lives === 0 ? 'К РЕЗУЛЬТАТАМ' : 'СЛЕДУЮЩИЙ РАУНД'}
              <ArrowRight size={20} />
            </button>
          </motion.div>
        )}
      </div>
      <div className="bonus-heading">
        <span />
        <small>ТВОЁ ПРЕИМУЩЕСТВО</small>
        <span />
      </div>
      <div className="bonus-grid">
        <button
          className={`bonus-button ${g.hint ? 'bonus-active' : ''}`}
          disabled={locked || g.hintLeft === 0}
          onClick={onHint}
        >
          <Lightbulb className="bonus-icon" />
          <div>
            <strong>
              Подсказка <span>{g.hintLeft}/1</span>
            </strong>
            <small>Покажет диапазон рейтинга</small>
          </div>
        </button>
        <button className="bonus-button" disabled={locked || g.swapsLeft === 0} onClick={onSwap}>
          <RefreshCw className="bonus-icon" />
          <div>
            <strong>
              Замена <span>{g.swapsLeft}/2</span>
            </strong>
            <small>Другой сериал без потерь</small>
          </div>
        </button>
        <div className={`bonus-button passive ${g.shield ? 'bonus-active' : ''}`}>
          <Shield className="bonus-icon" />
          <div>
            <strong>
              Защита <span>{g.shield ? 'АКТИВНА' : g.shieldEarned ? '0/1' : '0/1'}</span>
            </strong>
            <small>
              {g.shield
                ? 'Сохранит жизнь при ошибке'
                : g.shieldEarned
                  ? 'Щит уже использован'
                  : 'Автоматически за 7 подряд'}
            </small>
          </div>
        </div>
      </div>
      <p className="game-bottom">
        <Zap size={13} />
        {g.shield
          ? 'Ошибка потратит щит и сбросит комбо.'
          : 'Каждый правильный ответ приближает к новому рекорду.'}
        <Sparkles size={13} />
      </p>
    </div>
  );
}
