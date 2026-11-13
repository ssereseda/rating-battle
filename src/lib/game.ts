import type { Show } from './data';
export type Choice = 'higher' | 'lower';
export interface Game {
  phase: 'answer' | 'transition' | 'reveal' | 'finished';
  left: Show;
  right: Show;
  seen: string[];
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  correct: number;
  mistakes: number;
  oneLifeCombo: number;
  hintLeft: number;
  swapsLeft: number;
  hint: [number, number] | null;
  shield: boolean;
  shieldEarned: boolean;
  shieldUsed: boolean;
  last: { correct: boolean; points: number; protected: boolean; earnedShield: boolean } | null;
}
export const multiplier = (combo: number) =>
  combo >= 10 ? 3 : combo >= 5 ? 2 : combo >= 3 ? 1.5 : 1;
export function chooseShow(
  shows: Show[],
  left?: Show,
  seen: string[] = [],
  exclude?: string,
  random: () => number = Math.random,
): Show {
  const valid = shows.filter(
    (s) => s.id !== left?.id && s.id !== exclude && s.rating !== left?.rating,
  );
  if (!valid.length) throw new Error('Не найдена пара с разными рейтингами.');
  const unseen = valid.filter((s) => !seen.includes(s.id));
  const pool = unseen.length
    ? unseen
    : valid.filter((s) => seen.indexOf(s.id) === Math.min(...valid.map((v) => seen.indexOf(v.id))));
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
function visit(seen: string[], id: string) {
  return [...seen.filter((s) => s !== id), id];
}
export function startGame(shows: Show[]): Game {
  const left = chooseShow(shows);
  const right = chooseShow(shows, left, [left.id]);
  return {
    phase: 'answer',
    left,
    right,
    seen: [left.id, right.id],
    score: 0,
    lives: 3,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    mistakes: 0,
    oneLifeCombo: 0,
    hintLeft: 1,
    swapsLeft: 2,
    hint: null,
    shield: false,
    shieldEarned: false,
    shieldUsed: false,
    last: null,
  };
}
export function answer(g: Game, choice: Choice): Game {
  if (g.phase !== 'answer') return g;
  const correct =
    choice === 'higher' ? g.right.rating > g.left.rating : g.right.rating < g.left.rating;
  const combo = correct ? g.combo + 1 : 0;
  const points = correct ? 100 * multiplier(combo) : 0;
  const protectedLife = !correct && g.shield;
  const earnedShield = correct && combo >= 7 && !g.shieldEarned;
  return {
    ...g,
    phase: 'reveal',
    score: g.score + points,
    combo,
    maxCombo: Math.max(combo, g.maxCombo),
    lives: g.lives - (!correct && !protectedLife ? 1 : 0),
    correct: g.correct + Number(correct),
    mistakes: g.mistakes + Number(!correct),
    oneLifeCombo: correct && g.lives === 1 ? g.oneLifeCombo + 1 : 0,
    shield: earnedShield || (g.shield && !protectedLife),
    shieldEarned: g.shieldEarned || earnedShield,
    shieldUsed: g.shieldUsed || protectedLife,
    last: { correct, points, protected: protectedLife, earnedShield },
  };
}
export function nextRound(g: Game, shows: Show[]): Game {
  if (g.phase !== 'reveal') return g;
  if (g.lives === 0) return { ...g, phase: 'finished' };
  const right = chooseShow(shows, g.right, g.seen);
  return {
    ...g,
    left: g.right,
    right,
    seen: visit(g.seen, right.id),
    phase: 'answer',
    hint: null,
    last: null,
  };
}
export function hintRange(rating: number): [number, number] {
  const lower = Math.min(9.5, Math.max(0, Math.floor((rating * 10) / 5) * 0.5));
  return [lower, Number((lower + 0.5).toFixed(1))];
}
export function useHint(g: Game): Game {
  return g.phase === 'answer' && g.hintLeft > 0
    ? { ...g, hintLeft: 0, hint: hintRange(g.right.rating) }
    : g;
}
export function swap(g: Game, shows: Show[]): Game {
  if (g.phase !== 'answer' || g.swapsLeft === 0) return g;
  const right = chooseShow(shows, g.left, g.seen, g.right.id);
  return { ...g, right, seen: visit(g.seen, right.id), swapsLeft: g.swapsLeft - 1, hint: null };
}
