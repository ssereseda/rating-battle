import { Zap, Waves, GraduationCap, Crown, HeartPulse, ShieldCheck, Medal } from 'lucide-react';
import type { Game } from './game';
import type { Stats } from './storage';
export const achievements = [
  { id: 'first', title: 'Первый успех', description: 'Первый правильный ответ', icon: Zap },
  { id: 'wave', title: 'На волне', description: 'Пять правильных ответов подряд', icon: Waves },
  {
    id: 'expert',
    title: 'Сериальный эксперт',
    description: '15 правильных ответов за игру',
    icon: GraduationCap,
  },
  {
    id: 'legend',
    title: 'Легенда рейтингов',
    description: '5 000 очков за одну игру',
    icon: Crown,
  },
  {
    id: 'last',
    title: 'На последнем дыхании',
    description: 'Пять ответов подряд с одной жизнью',
    icon: HeartPulse,
  },
  {
    id: 'shield',
    title: 'Непробиваемый',
    description: 'Защита сохранила жизнь',
    icon: ShieldCheck,
  },
  { id: 'collector', title: 'Коллекционер', description: 'Пять завершённых игр', icon: Medal },
];
export function unlock(stats: Stats, g: Game, now = new Date().toISOString()): Stats {
  const conditions: Record<string, boolean> = {
    first: g.correct >= 1,
    wave: g.maxCombo >= 5,
    expert: g.correct >= 15,
    legend: g.score >= 5000,
    last: g.oneLifeCombo >= 5,
    shield: g.shieldUsed,
    collector: stats.games >= 5,
  };
  const opened = { ...stats.achievements };
  for (const a of achievements) if (conditions[a.id] && !opened[a.id]) opened[a.id] = now;
  return { ...stats, achievements: opened };
}
