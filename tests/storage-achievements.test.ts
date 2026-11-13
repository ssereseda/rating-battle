import { beforeEach, describe, it, expect, vi } from 'vitest';
import { shows } from './fixtures';
import { emptyStats, readStats, saveStats, STORAGE_KEY } from '../src/lib/storage';
import { unlock } from '../src/lib/achievements';
import { startGame, answer, nextRound } from '../src/lib/game';
import { createReducer } from '../src/lib/appState';
import type { AppState } from '../src/lib/appState';
beforeEach(() => localStorage.clear());
describe('Хранение статистики', () => {
  it('возвращает нули при первом запуске и испорченном JSON', () => {
    expect(readStats()).toEqual(emptyStats());
    localStorage.setItem(STORAGE_KEY, '{oops');
    expect(readStats()).toEqual(emptyStats());
  });
  it('проверяет версию, типы и отрицательные значения', () => {
    for (const value of [
      { ...emptyStats(), version: 2 },
      { ...emptyStats(), best: -1 },
      { ...emptyStats(), games: '5' },
      { ...emptyStats(), achievements: null },
    ]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      expect(readStats()).toEqual(emptyStats());
    }
  });
  it('проверяет даты и неизвестные достижения', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...emptyStats(),
        achievements: { first: '2026-11-13T10:00:00.000Z', wave: 'нет', unknown: '2026-11-13' },
      }),
    );
    expect(Object.keys(readStats().achievements)).toEqual(['first']);
  });
  it('сохраняет и восстанавливает все значения после перезагрузки', () => {
    const stats = {
      ...emptyStats(),
      best: 1700,
      games: 3,
      correct: 20,
      maxCombo: 8,
      achievements: { first: '2026-11-13T10:00:00.000Z' },
    };
    expect(saveStats(stats)).toBe(true);
    expect(readStats()).toEqual(stats);
  });
  it('переживает запрет доступа к хранилищу', () => {
    expect(
      readStats({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toEqual(emptyStats());
    const getter = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStats()).toEqual(emptyStats());
    expect(saveStats(emptyStats())).toBe(false);
    getter.mockRestore();
  });
});
describe('Достижения и завершение сессий', () => {
  it('открывает все семь достижений по условиям и сохраняет первую дату', () => {
    const g = {
      ...startGame(shows),
      correct: 20,
      score: 5000,
      maxCombo: 7,
      oneLifeCombo: 5,
      shieldUsed: true,
    };
    const first = unlock({ ...emptyStats(), games: 5 }, g, '2026-11-13T10:00:00.000Z');
    expect(Object.keys(first.achievements)).toHaveLength(7);
    expect(unlock(first, g, '2026-11-14T10:00:00.000Z').achievements).toEqual(first.achievements);
  });
  it('не открывает достижения до достижения условий', () => {
    expect(unlock(emptyStats(), startGame(shows))).toEqual(emptyStats());
  });
  it('засчитывает только полные игры и один раз', () => {
    const reduce = createReducer(shows);
    let state: AppState = {
      screen: 'home',
      game: null,
      stats: emptyStats(),
      newRecord: false,
      toasts: [],
    };
    state = reduce(state, { type: 'start' });
    state = reduce(state, { type: 'home' });
    expect(state.stats.games).toBe(0);
    for (let n = 1; n <= 5; n++) {
      state = reduce(state, { type: 'start' });
      for (let i = 0; i < 3; i++) {
        const g = state.game!;
        state = reduce(state, {
          type: 'answer',
          choice: g.right.rating > g.left.rating ? 'lower' : 'higher',
        });
        state = reduce(state, { type: 'next' });
        state = reduce(state, { type: 'ready' });
      }
      expect(state.screen).toBe('results');
      expect(state.stats.games).toBe(n);
      expect(reduce(state, { type: 'next' }).stats.games).toBe(n);
    }
    expect(state.stats.achievements.collector).toBeTruthy();
  });
  it('сохраняет лучший результат и достижения при новом старте', () => {
    const reduce = createReducer(shows);
    let state: AppState = {
      screen: 'home',
      game: null,
      stats: emptyStats(),
      newRecord: false,
      toasts: [],
    };
    state = reduce(state, { type: 'start' });
    const g = state.game!;
    state = reduce(state, {
      type: 'answer',
      choice: g.right.rating > g.left.rating ? 'higher' : 'lower',
    });
    expect(state.stats.correct).toBe(1);
    const once = state;
    state = reduce(state, { type: 'answer', choice: 'higher' });
    expect(state).toBe(once);
    expect(state.stats.achievements.first).toBeTruthy();
    state = reduce(state, { type: 'home' });
    state = reduce(state, { type: 'start' });
    expect(state.game?.score).toBe(0);
    expect(state.game?.lives).toBe(3);
    expect(state.stats.achievements.first).toBeTruthy();
  });
  it('фиксирует рекорд только по завершении и не уменьшает его', () => {
    let game = startGame(shows);
    game = nextRound(
      answer(game, game.right.rating > game.left.rating ? 'higher' : 'lower'),
      shows,
    );
    for (let i = 0; i < 2; i++)
      game = nextRound(
        answer(game, game.right.rating > game.left.rating ? 'lower' : 'higher'),
        shows,
      );
    game = answer(game, game.right.rating > game.left.rating ? 'lower' : 'higher');
    const reduce = createReducer(shows);
    const result = reduce(
      { screen: 'game', game, stats: emptyStats(), toasts: [], newRecord: false },
      { type: 'next' },
    );
    expect(result.newRecord).toBe(true);
    expect(result.stats.best).toBe(100);
    const preserved = reduce(
      { ...result, screen: 'game', game: { ...game, score: 0 } },
      { type: 'next' },
    );
    expect(preserved.stats.best).toBe(100);
    expect(preserved.newRecord).toBe(false);
  });
});

describe('Переходы карточек', () => {
  it('блокирует ответы и повторную замену во время анимации', () => {
    const reduce = createReducer(shows);
    let state: AppState = {
      screen: 'game',
      game: startGame(shows),
      stats: emptyStats(),
      newRecord: false,
      toasts: [],
    };
    state = reduce(state, { type: 'swap' });
    expect(state.game?.phase).toBe('transition');
    const locked = state.game;
    state = reduce(state, { type: 'answer', choice: 'higher' });
    expect(state.game).toBe(locked);
    state = reduce(state, { type: 'swap' });
    expect(state.game).toBe(locked);
    state = reduce(state, { type: 'ready' });
    expect(state.game?.phase).toBe('answer');
    const g = state.game!;
    state = reduce(state, {
      type: 'answer',
      choice: g.right.rating > g.left.rating ? 'higher' : 'lower',
    });
    state = reduce(state, { type: 'next' });
    expect(state.game?.phase).toBe('transition');
    const current = state.game;
    state = reduce(state, { type: 'next' });
    expect(state.game).toBe(current);
    expect(state.game?.score).toBe(100);
  });
});

describe('Пороги достижений на реальных раундах', () => {
  it('открывает достижения ровно на нужной серии, количестве ответов и очках', () => {
    let g = startGame(shows);
    let stats = emptyStats();
    for (let n = 1; n <= 21; n++) {
      g = answer(g, g.right.rating > g.left.rating ? 'higher' : 'lower');
      stats = unlock(stats, g);
      expect(Boolean(stats.achievements.wave)).toBe(n >= 5);
      expect(Boolean(stats.achievements.expert)).toBe(n >= 15);
      expect(Boolean(stats.achievements.legend)).toBe(n >= 21);
      g = nextRound(g, shows);
    }
    expect(g.score).toBe(5100);
  });
});
