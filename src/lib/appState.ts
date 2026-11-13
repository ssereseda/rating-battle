import type { Show } from './data';
import { answer, nextRound, startGame, swap, useHint } from './game';
import type { Choice, Game } from './game';
import { unlock } from './achievements';
import type { Stats } from './storage';
export interface AppState {
  screen: 'home' | 'game' | 'results';
  game: Game | null;
  stats: Stats;
  newRecord: boolean;
  toasts: string[];
}
export type Action =
  | { type: 'start' }
  | { type: 'answer'; choice: Choice }
  | { type: 'next' }
  | { type: 'hint' }
  | { type: 'swap' }
  | { type: 'home' }
  | { type: 'ready' }
  | { type: 'dismiss'; id: string };
export function createReducer(shows: Show[]) {
  return (state: AppState, action: Action): AppState => {
    if (action.type === 'start')
      return { ...state, screen: 'game', game: startGame(shows), newRecord: false };
    if (action.type === 'home') return { ...state, screen: 'home', game: null };
    if (action.type === 'dismiss')
      return { ...state, toasts: state.toasts.filter((id) => id !== action.id) };
    const g = state.game;
    if (!g || state.screen !== 'game') return state;
    let game = g;
    let stats = state.stats;
    let newRecord = state.newRecord;
    let screen: AppState['screen'] = state.screen;
    if (action.type === 'ready') {
      if (g.phase !== 'transition') return state;
      game = { ...g, phase: 'answer' };
    } else if (action.type === 'answer') {
      game = answer(g, action.choice);
      if (game === g) return state;
      stats = {
        ...stats,
        correct: stats.correct + Number(game.last?.correct),
        maxCombo: Math.max(stats.maxCombo, game.maxCombo),
      };
    } else if (action.type === 'hint') game = useHint(g);
    else if (action.type === 'swap') game = swap(g, shows);
    else if (action.type === 'next') {
      game = nextRound(g, shows);
      if (game.phase === 'finished' && g.phase !== 'finished') {
        newRecord = game.score > stats.best;
        stats = { ...stats, best: Math.max(stats.best, game.score), games: stats.games + 1 };
        screen = 'results';
      }
    }
    // Пока карточки меняются, новые ответы и бонусы заблокированы.
    if ((action.type === 'next' || action.type === 'swap') && game !== g && game.phase === 'answer')
      game = { ...game, phase: 'transition' };
    stats = unlock(stats, game);
    const newly = Object.keys(stats.achievements).filter((id) => !state.stats.achievements[id]);
    return { ...state, game, stats, newRecord, screen, toasts: [...state.toasts, ...newly] };
  };
}
