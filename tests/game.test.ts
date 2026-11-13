import { describe, it, expect } from 'vitest';
import { shows } from './fixtures';
import type { Game, Choice } from '../src/lib/game';
import {
  answer,
  chooseShow,
  hintRange,
  multiplier,
  nextRound,
  startGame,
  swap,
  useHint,
} from '../src/lib/game';
const right = (g: Game): Choice => (g.right.rating > g.left.rating ? 'higher' : 'lower');
const wrong = (g: Game): Choice => (right(g) === 'higher' ? 'lower' : 'higher');
function streak(g: Game, count: number) {
  for (let i = 0; i < count; i++) g = nextRound(answer(g, right(g)), shows);
  return g;
}
describe('Игровая механика', () => {
  it('начинает с трёх жизней и разных рейтингов', () => {
    const g = startGame(shows);
    expect(g.lives).toBe(3);
    expect(g.score).toBe(0);
    expect(g.left.id).not.toBe(g.right.id);
    expect(g.left.rating).not.toBe(g.right.rating);
    expect(g.hintLeft).toBe(1);
    expect(g.swapsLeft).toBe(2);
  });
  it('считает множитель по новой серии', () => {
    let g = startGame(shows);
    const rewards = [];
    for (let i = 1; i <= 10; i++) {
      g = answer(g, right(g));
      rewards.push(g.last?.points);
      g = nextRound(g, shows);
    }
    expect(rewards).toEqual([100, 100, 150, 150, 200, 200, 200, 200, 200, 300]);
    expect(g.score).toBe(1800);
    expect(multiplier(3)).toBe(1.5);
  });
  it('не начисляет очки дважды за один раунд', () => {
    const answered = answer(startGame(shows), 'higher');
    expect(answer(answered, 'lower')).toBe(answered);
    expect(useHint(answered)).toBe(answered);
    expect(swap(answered, shows)).toBe(answered);
  });
  it('не переключает раунды до раскрытия и не реагирует на двойное продолжение', () => {
    const g = startGame(shows);
    expect(nextRound(g, shows)).toBe(g);
    const next = nextRound(answer(g, right(g)), shows);
    expect(nextRound(next, shows)).toBe(next);
    expect(next.left).toBe(g.right);
  });
  it('ошибка обнуляет комбо, оставляя заработанные очки', () => {
    let g = streak(startGame(shows), 3);
    const score = g.score;
    g = answer(g, wrong(g));
    expect(g.combo).toBe(0);
    expect(g.lives).toBe(2);
    expect(g.score).toBe(score);
    expect(g.maxCombo).toBe(3);
  });
  it('выдаёт щит ровно один раз и сохраняет жизнь при ошибке', () => {
    let g = streak(startGame(shows), 7);
    expect(g.shield).toBe(true);
    expect(g.shieldEarned).toBe(true);
    g = answer(g, wrong(g));
    expect(g.lives).toBe(3);
    expect(g.combo).toBe(0);
    expect(g.shield).toBe(false);
    expect(g.last?.protected).toBe(true);
    g = streak(nextRound(g, shows), 14);
    expect(g.shield).toBe(false);
    expect(g.shieldUsed).toBe(true);
  });
  it('раскрывает последнюю ошибку до окончания игры', () => {
    let g = startGame(shows);
    for (let i = 0; i < 2; i++) g = nextRound(answer(g, wrong(g)), shows);
    g = answer(g, wrong(g));
    expect(g.lives).toBe(0);
    expect(g.phase).toBe('reveal');
    expect(useHint(g)).toBe(g);
    const finished = nextRound(g, shows);
    expect(finished.phase).toBe('finished');
    expect(nextRound(finished, shows)).toBe(finished);
  });
  it('подсказка один раз и диапазон 0,5 всегда включает рейтинг', () => {
    let g = startGame(shows);
    g = useHint(g);
    expect(g.hintLeft).toBe(0);
    expect(useHint(g)).toBe(g);
    for (let i = 0; i <= 100; i++) {
      const r = i / 10;
      const [lo, hi] = hintRange(r);
      expect(hi - lo).toBeCloseTo(0.5);
      expect(lo).toBeGreaterThanOrEqual(0);
      expect(hi).toBeLessThanOrEqual(10);
      expect(r).toBeGreaterThanOrEqual(lo);
      expect(r).toBeLessThanOrEqual(hi);
    }
  });
  it('две замены сохраняют первую карточку, очки и комбо, скрывают прошлую подсказку', () => {
    let g = useHint(streak(startGame(shows), 3));
    const original = g;
    for (let i = 0; i < 2; i++) {
      const previous = g.right.id;
      g = swap(g, shows);
      expect(g.right.id).not.toBe(previous);
      expect(g.right.rating).not.toBe(g.left.rating);
      expect(g.left).toBe(original.left);
      expect(g.score).toBe(original.score);
      expect(g.combo).toBe(3);
      expect(g.lives).toBe(3);
      expect(g.hint).toBeNull();
    }
    expect(g.swapsLeft).toBe(0);
    expect(swap(g, shows)).toBe(g);
  });
  it('выбирает неиспользованные сериалы и затем давно показанные', () => {
    const left = shows[0];
    const eligible = shows.filter((s) => s.id !== left.id && s.rating !== left.rating);
    const last = eligible.at(-1)!;
    expect(
      chooseShow(
        shows,
        left,
        shows.filter((s) => s.id !== last.id).map((s) => s.id),
      ),
    ).toBe(last);
    const seen = shows.map((s) => s.id);
    expect(chooseShow(shows, left, seen)).toBe(eligible[0]);
  });
  it('работает 1000 раундов после исчерпания датасета, без равных пар', () => {
    let g = startGame(shows);
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      expect(g.left.rating).not.toBe(g.right.rating);
      expect(g.left.id).not.toBe(g.right.id);
      seen.add(g.left.id);
      seen.add(g.right.id);
      g = nextRound(answer(g, right(g)), shows);
    }
    expect(g.lives).toBe(3);
    expect(g.correct).toBe(1000);
    expect(seen.size).toBe(50);
  });
  it('считает пять подряд на одной жизни с нуля после ошибки', () => {
    let g = startGame(shows);
    for (let i = 0; i < 2; i++) g = nextRound(answer(g, wrong(g)), shows);
    g = streak(g, 5);
    expect(g.oneLifeCombo).toBe(5);
    expect(g.lives).toBe(1);
  });
});
