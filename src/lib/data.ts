import Papa from 'papaparse';
import { embeddedData } from './embedded';
export interface Show {
  id: string;
  title: string;
  years: string;
  year: number;
  description: string;
  genre: string;
  director: string;
  actors: string;
  rating: number;
  votes: number;
  poster: string;
  url: string;
}
const columns = [
  'ссылка',
  'картинка',
  'название',
  'года',
  'описание',
  'в ролях',
  'рейтинг кп',
  'числооценок',
];
function safeUrl(value: string, host?: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' &&
      (!host || u.hostname === host || u.hostname.endsWith('.' + host))
      ? value
      : '';
  } catch {
    return '';
  }
}
export function parseShows(csv: string): Show[] {
  const result = Papa.parse<Record<string, string>>(csv.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  if (
    result.errors.length ||
    result.meta.fields?.length !== columns.length ||
    !columns.every((c) => result.meta.fields?.includes(c))
  )
    throw new Error('Структура CSV не соответствует ожидаемым восьми столбцам.');
  const shows = result.data.map((row, index) => {
    const rating = Number(row['рейтинг кп'].trim().replace(',', '.'));
    const votes = Number(row['числооценок'].replace(/[\s\u00a0]/g, ''));
    const title = row['название'].trim();
    const years = row['года'].trim();
    const year = Number(years.match(/\d{4}/)?.[0]);
    const url = safeUrl(row['ссылка'].trim(), 'kinopoisk.ru');
    if (
      !title ||
      !url ||
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 10 ||
      !Number.isSafeInteger(votes) ||
      votes < 0 ||
      !year
    )
      throw new Error(`Некорректные данные в строке ${index + 2}.`);
    const description = row['описание'].trim();
    const parts = description.split(/Режисс[её]р\s*:/i);
    return {
      id: url,
      title,
      years,
      year,
      description,
      genre: parts[0].trim(),
      director: parts[1]?.trim() || '',
      actors: row['в ролях'].replace(/^В ролях:\s*/i, '').trim(),
      rating,
      votes,
      poster: safeUrl(row['картинка'].trim()),
      url,
    };
  });
  if (shows.length !== 50 || new Set(shows.map((s) => s.id)).size !== 50)
    throw new Error('В исходном CSV должно быть ровно 50 разных сериалов.');
  if (new Set(shows.map((s) => s.rating)).size < 2)
    throw new Error('Для игры нужны разные рейтинги.');
  return shows;
}
export async function loadShows(): Promise<Show[]> {
  const embedded = embeddedData<string>('rating-battle-data');
  if (embedded !== null) return parseShows(embedded);
  let csv: string;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}creative_hse_2026%20-%20kinopoisk.csv`);
    if (!res.ok) throw new Error('HTTP');
    csv = await res.text();
  } catch {
    throw new Error(
      'Не удалось загрузить файл с сериалами. Проверь подключение и попробуй ещё раз.',
    );
  }
  return parseShows(csv);
}
export const ratingText = (n: number) => n.toFixed(1).replace('.', ',');
export const numberText = (n: number) =>
  new Intl.NumberFormat('ru-RU').format(n).replace(/\u00a0/g, ' ');
export type SortMode = 'rating' | 'votes' | 'year';
export function sortShows(shows: Show[], mode: SortMode) {
  return [...shows].sort(
    (a, b) =>
      (mode === 'year'
        ? b.year - a.year
        : mode === 'votes'
          ? b.votes - a.votes
          : b.rating - a.rating) ||
      b.rating - a.rating ||
      b.votes - a.votes ||
      a.title.localeCompare(b.title, 'ru'),
  );
}
