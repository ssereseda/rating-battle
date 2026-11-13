import { motion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Flame,
  Gamepad2,
  Heart,
  Medal,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import type { Show } from '../lib/data';
import { numberText, ratingText } from '../lib/data';
import type { Stats } from '../lib/storage';
import { Poster } from './Poster';
export function Home({
  shows,
  stats,
  onPlay,
  onRules,
  onAchievements,
}: {
  shows: Show[];
  stats: Stats;
  onPlay: () => void;
  onRules: () => void;
  onAchievements: () => void;
}) {
  const featured = [shows[0], shows[1], shows[2]];
  return (
    <>
      <section className="hero">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="eyebrow">
            <span className="live-dot" />
            ТВОЯ ИНТУИЦИЯ. ИХ РЕЙТИНГИ.
          </div>
          <h1 aria-label="РЕЙТИНГ-БАТТЛ">
            РЕЙТИНГ
            <span className="accent">
              БАТТЛ<span className="title-star">✳</span>
            </span>
          </h1>
          <h2>
            Насколько хорошо ты знаешь
            <br className="desktop-break" /> лучшие сериалы?
          </h2>
          <p className="hero-description">
            Сравнивай рейтинги Кинопоиска,
            <br className="desktop-break" /> собирай комбо и побей свой рекорд.
          </p>
          <button className="button primary play-button" onClick={onPlay}>
            <Play fill="currentColor" size={20} />
            ИГРАТЬ
            <ArrowRight size={22} />
          </button>
          <div className="hero-links">
            <button onClick={onRules}>
              <Gamepad2 size={18} />
              Как играть
            </button>
            <span />
            <button onClick={onAchievements}>
              <Medal size={18} />
              Достижения <small>{Object.keys(stats.achievements).length}/7</small>
            </button>
          </div>
          <div className="hero-note">
            <Heart size={14} />3 жизни <i /> Без таймера <i /> Только твоя интуиция
          </div>
        </motion.div>
        <motion.div
          className="hero-art"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          aria-label="Реальные сериалы из игры"
        >
          <div className="art-stage">
            <div className="orbital orbital-one" />
            <div className="orbital orbital-two" />
            <span className="art-star star-one">✳</span>
            <span className="art-star star-two">+</span>
            <div className="floating-tag tag-top">
              <Sparkles size={15} /> 50 культовых сериалов
            </div>
            {featured.map((show, i) => (
              <motion.div
                key={show.id}
                className={`show-ticket ticket-${i}`}
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="ticket-top">
                  <span>КИНОПОИСК</span>
                  <span>0{i + 1}</span>
                </div>
                <Poster show={show} />
                <div className="ticket-caption">
                  <span>{show.title}</span>
                  <small>{show.years}</small>
                </div>
                <div className="ticket-rating">
                  {i === 1 ? (
                    <>
                      <span className="unknown">?</span>
                      <small>ВЫШЕ ИЛИ НИЖЕ?</small>
                    </>
                  ) : (
                    <>
                      <strong>{ratingText(show.rating)}</strong>
                      <small>РЕЙТИНГ КП</small>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
            <div className="versus-art">VS</div>
            <div className="floating-tag tag-bottom">
              <ArrowUp size={18} />
              <span>Доверься чутью</span>
              <ArrowDown size={18} />
            </div>
            <span className="art-caption">ТЫ СМОТРЕЛ. А ТЫ ПОМНИШЬ?</span>
          </div>
        </motion.div>
      </section>
      <section className="stats-strip" aria-label="Личная статистика">
        <div className="stats-label">
          <span className="mini-icon">
            <Trophy />
          </span>
          <span>
            ТВОЯ ЛИЧНАЯ
            <br />
            <b>ИСТОРИЯ ИГРЫ</b>
          </span>
        </div>
        <div className="home-stat">
          <strong>
            {numberText(stats.best)}
            <small>очков</small>
          </strong>
          <span>Лучший результат</span>
        </div>
        <div className="home-stat">
          <strong>
            {stats.maxCombo}
            <Flame size={21} />
          </strong>
          <span>Максимальная серия</span>
        </div>
        <div className="home-stat">
          <strong>
            {stats.games}
            <Gamepad2 size={21} />
          </strong>
          <span>Всего сыграно игр</span>
        </div>
      </section>
      <section className="feature-section">
        <div className="section-kicker">
          <span>ПРОСТО НАЧАТЬ. СЛОЖНО ОСТАНОВИТЬСЯ.</span>
          <span className="tiny-line" />
        </div>
        <div className="feature-grid">
          <article>
            <div className="feature-icon primary-tone">
              <ArrowUp />
              <ArrowDown />
            </div>
            <div>
              <h3>Выше или ниже?</h3>
              <p>
                Два сериала. Один выбор.
                <br />
                Угадай, чей рейтинг выше.
              </p>
            </div>
            <span className="feature-number">01</span>
          </article>
          <article>
            <div className="feature-icon soft-tone">
              <Zap />
            </div>
            <div>
              <h3>Лови комбо</h3>
              <p>
                Отвечай верно подряд
                <br />и умножай очки до ×3.
              </p>
            </div>
            <span className="feature-number">02</span>
          </article>
          <article>
            <div className="feature-icon neutral-tone">
              <ShieldCheck />
            </div>
            <div>
              <h3>Играй с преимуществом</h3>
              <p>
                Подсказка, замена и щит
                <br />
                помогут побить рекорд.
              </p>
            </div>
            <span className="feature-number">03</span>
          </article>
        </div>
      </section>
    </>
  );
}
