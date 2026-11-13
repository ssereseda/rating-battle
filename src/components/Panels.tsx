import { ArrowRight, Lightbulb, Lock, RefreshCw, Shield } from 'lucide-react';
import { achievements } from '../lib/achievements';
import type { Stats } from '../lib/storage';
export function Rules({ onPlay }: { onPlay: () => void }) {
  const rules = [
    'Перед тобой два сериала.',
    'Рейтинг первого известен, рейтинг второго — скрыт.',
    'Угадай, рейтинг второго выше или ниже. Равных рейтингов в паре не бывает.',
    'За верные ответы получай очки и увеличивай комбо.',
    'У тебя три жизни. Ошибка забирает жизнь и сбрасывает серию.',
    'Используй специальные способности, чтобы продержаться дольше.',
    'Набери максимум очков и установи новый рекорд!',
  ];
  return (
    <>
      <p className="muted">Без спешки. Без таймера. С опорой на интуицию.</p>
      <ol className="rules-list">
        {rules.map((rule, i) => (
          <li key={rule}>
            <span>{i + 1}</span>
            {rule}
          </li>
        ))}
      </ol>
      <div className="rules-points">
        <h3>Чем длиннее серия, тем больше очков</h3>
        <div>
          {[
            ['1–2', '×1'],
            ['3–4', '×1,5'],
            ['5–9', '×2'],
            ['10+', '×3'],
          ].map(([range, m]) => (
            <span key={range}>
              <strong>{m}</strong>
              <small>{range} подряд</small>
            </span>
          ))}
        </div>
        <p>Базовая награда — 100 очков. Множитель считается по новой длине серии.</p>
      </div>
      <div className="rules-bonuses">
        <p>
          <Lightbulb /> <b>Подсказка</b> — диапазон рейтинга шириной 0,5. Один раз.
        </p>
        <p>
          <RefreshCw /> <b>Замена</b> — другой сериал без потери комбо. Два раза.
        </p>
        <p>
          <Shield /> <b>Защита</b> — автоматически за серию из 7 ответов. Спасает от одной ошибки,
          но сбрасывает комбо. Один щит за игру.
        </p>
      </div>
      <p className="muted small">
        После ответа нажми «Следующий раунд». Второй сериал станет первым.
      </p>
      <button className="button primary full" onClick={onPlay}>
        ПОНЯТНО, ИГРАТЬ!
        <ArrowRight size={19} />
      </button>
    </>
  );
}
export function AchievementPanel({ stats }: { stats: Stats }) {
  const count = Object.keys(stats.achievements).length;
  return (
    <>
      <p className="muted">
        Открыто <strong className="accent">{count} из 7</strong> достижений
      </p>
      <div className="progress-track">
        <div style={{ width: `${(count / 7) * 100}%` }} />
      </div>
      <div className="achievement-grid">
        {achievements.map((a) => {
          const date = stats.achievements[a.id];
          return (
            <article className={`achievement ${date ? 'unlocked' : ''}`} key={a.id}>
              <div className="achievement-icon">
                <a.icon />
              </div>
              <div>
                <h3>{a.title}</h3>
                <p>{a.description}</p>
                <small>
                  {date ? (
                    `Получено ${new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow' }).format(new Date(date))}`
                  ) : (
                    <>
                      <Lock size={11} />
                      Ещё не открыто
                    </>
                  )}
                </small>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
