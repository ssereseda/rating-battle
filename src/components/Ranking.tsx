import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ExternalLink, Search, SlidersHorizontal, Trophy, X } from 'lucide-react';
import type { Show, SortMode } from '../lib/data';
import { numberText, ratingText, sortShows } from '../lib/data';
import { Poster } from './Poster';
export function Ranking({ shows }: { shows: Show[] }) {
  const [mode, setMode] = useState<SortMode>('rating');
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<string | null>(null);
  const sorted = useMemo(() => sortShows(shows, mode), [shows, mode]);
  const rows = sorted
    .map((show, i) => ({ show, rank: i + 1 }))
    .filter(({ show }) =>
      show.title
        .toLocaleLowerCase('ru')
        .replaceAll('ё', 'е')
        .includes(query.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е')),
    );
  return (
    <section className="ranking">
      <div className="ranking-intro">
        <span className="eyebrow">
          <Trophy size={15} />
          50 СЕРИАЛОВ. ПОЛНАЯ КАРТИНА.
        </span>
        <h2>РЕЙТИНГ СЕРИАЛОВ</h2>
        <p>Узнай, как распределились места в рейтинге Кинопоиска.</p>
      </div>
      <div className="ranking-tools">
        <label className="search-field">
          <Search size={18} />
          <input
            type="search"
            placeholder="Найти сериал…"
            aria-label="Поиск по названию сериала"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Очистить поиск">
              <X size={16} />
            </button>
          )}
        </label>
        <label className="sort-field">
          <SlidersHorizontal size={17} />
          <span className="sr-only">Сортировка сериалов</span>
          <select
            aria-label="Сортировка сериалов"
            value={mode}
            onChange={(e) => setMode(e.target.value as SortMode)}
          >
            <option value="rating">По рейтингу</option>
            <option value="votes">По количеству оценок</option>
            <option value="year">По году выхода</option>
          </select>
          <ChevronDown size={16} />
        </label>
      </div>
      <div className="ranking-table-head">
        <span>МЕСТО</span>
        <span>СЕРИАЛ</span>
        <span>РЕЙТИНГ КП</span>
        <span>ОЦЕНОК</span>
        <span />
      </div>
      <div className="ranking-list">
        <AnimatePresence initial={false}>
          {rows.map(({ show, rank }) => (
            <motion.article
              layout="position"
              key={show.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`ranking-row rank-${rank <= 3 ? rank : 'other'}`}
            >
              <button
                className="ranking-row-main"
                onClick={() => setOpened(opened === show.id ? null : show.id)}
                aria-expanded={opened === show.id}
                aria-controls={`details-${show.url.match(/\d+/)?.[0]}`}
              >
                <span className="rank-position">
                  {rank < 4 ? <Trophy size={17} /> : null}
                  <span>{String(rank).padStart(2, '0')}</span>
                </span>
                <div className="ranking-show">
                  <Poster show={show} />
                  <div>
                    <h3>{show.title}</h3>
                    <span>{show.years}</span>
                  </div>
                </div>
                <strong className="ranking-rating">{ratingText(show.rating)}</strong>
                <span className="ranking-votes">
                  {numberText(show.votes)}
                  <small>оценок</small>
                </span>
                <ChevronDown
                  size={18}
                  className={opened === show.id ? 'chevron rotated' : 'chevron'}
                />
              </button>
              <AnimatePresence initial={false}>
                {opened === show.id && (
                  <motion.div
                    id={`details-${show.url.match(/\d+/)?.[0]}`}
                    className="ranking-detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="detail-inner">
                      <dl>
                        <div>
                          <dt>Страна и жанр</dt>
                          <dd>{show.genre}</dd>
                        </div>
                        <div>
                          <dt>Режиссёр</dt>
                          <dd>{show.director || 'Не указан в датасете'}</dd>
                        </div>
                        <div className="detail-wide">
                          <dt>В ролях</dt>
                          <dd>{show.actors || 'Не указаны в датасете'}</dd>
                        </div>
                        <div className="detail-wide">
                          <dt>Описание из CSV</dt>
                          <dd>{show.description}</dd>
                        </div>
                      </dl>
                      <a href={show.url} target="_blank" rel="noopener noreferrer">
                        Открыть на Кинопоиске
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      {rows.length === 0 && (
        <div className="empty-search">
          <Search />
          <h3>Такого сериала в списке нет</h3>
          <p>Попробуй другое название или очисти поиск.</p>
          <button className="button outline" onClick={() => setQuery('')}>
            Очистить поиск
          </button>
        </div>
      )}
      <div className="ranking-foot">
        <span>
          Показано {rows.length} из {shows.length} сериалов
        </span>
        <span>
          {mode === 'year'
            ? 'По первому году выхода: от новых к ранним'
            : 'По убыванию · данные исходного CSV'}
        </span>
      </div>
    </section>
  );
}
