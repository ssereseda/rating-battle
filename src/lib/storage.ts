export const STORAGE_KEY = 'rating-battle:stats:v1';
export interface Stats {
  version: 1;
  best: number;
  maxCombo: number;
  games: number;
  correct: number;
  achievements: Record<string, string>;
}
export const emptyStats = (): Stats => ({
  version: 1,
  best: 0,
  maxCombo: 0,
  games: 0,
  correct: 0,
  achievements: {},
});
export const achievementIds = [
  'first',
  'wave',
  'expert',
  'legend',
  'last',
  'shield',
  'collector',
] as const;
export function readStats(storage?: Pick<Storage, 'getItem'>): Stats {
  try {
    const value = JSON.parse((storage ?? window.localStorage).getItem(STORAGE_KEY) || 'null');
    if (
      !value ||
      value.version !== 1 ||
      !['best', 'maxCombo', 'games', 'correct'].every(
        (k) => Number.isSafeInteger(value[k]) && value[k] >= 0,
      ) ||
      !value.achievements ||
      typeof value.achievements !== 'object' ||
      Array.isArray(value.achievements)
    )
      return emptyStats();
    const achievements: Record<string, string> = {};
    for (const key of achievementIds)
      if (
        typeof value.achievements[key] === 'string' &&
        Number.isFinite(Date.parse(value.achievements[key]))
      )
        achievements[key] = value.achievements[key];
    return {
      version: 1,
      best: value.best,
      maxCombo: value.maxCombo,
      games: value.games,
      correct: value.correct,
      achievements,
    };
  } catch {
    return emptyStats();
  }
}
export function saveStats(stats: Stats): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    return true;
  } catch {
    return false;
  }
}
