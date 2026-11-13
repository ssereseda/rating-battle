import { describe, it, expect, vi } from 'vitest';
import { csv, shows } from './fixtures';
import { loadShows, numberText, parseShows, ratingText, sortShows } from '../src/lib/data';
describe('Реальный CSV', () => {
  it('читает все 50 уникальных сериалов без изменения значений', () => {
    expect(shows).toHaveLength(50);
    expect(new Set(shows.map((s) => s.id)).size).toBe(50);
    expect(shows[0]).toMatchObject({
      title: 'Во все тяжкие',
      rating: 8.9,
      votes: 910842,
      years: '2008–2013',
      genre: 'США • криминал',
      director: 'Мишель Макларен',
      actors: 'Брайан Крэнстон, Анна Ганн',
    });
    expect(shows.at(-1)?.title).toBe('Любовники');
  });
  it('поддерживает BOM, русские заголовки и запятую в рейтинге', () => {
    expect(parseShows('\ufeff' + csv)).toEqual(shows);
    expect(parseShows(csv.replace(',8.9,', ',"8,9",'))[0].rating).toBe(8.9);
  });
  it('выявляет повреждение структуры, неполный набор и плохие числа', () => {
    expect(() => parseShows('abc\n123')).toThrow();
    expect(() => parseShows(csv.split('\n').slice(0, 10).join('\n'))).toThrow();
    expect(() => parseShows(csv.replace('910842', 'ошибка'))).toThrow();
    expect(() => parseShows(csv.replace('8.9', '18.9'))).toThrow();
  });
  it('сортирует рейтинг с разрешением равенства по голосам', () => {
    const ranked = sortShows(shows, 'rating');
    for (let i = 1; i < ranked.length; i++) {
      const a = ranked[i - 1],
        b = ranked[i];
      expect(a.rating).toBeGreaterThanOrEqual(b.rating);
      if (a.rating === b.rating) expect(a.votes).toBeGreaterThanOrEqual(b.votes);
    }
    expect(shows[0].title).toBe('Во все тяжкие');
  });
  it('при полном совпадении сортирует названия по русскому алфавиту', () => {
    const a = { ...shows[0], votes: shows[1].votes, rating: shows[1].rating };
    const ranked = sortShows([shows[1], a], 'rating');
    expect(ranked.map((x) => x.title)).toEqual(['Во все тяжкие', 'Игра престолов']);
  });
  it('сортирует по голосам и первому году выхода', () => {
    for (const mode of ['votes', 'year'] as const) {
      const list = sortShows(shows, mode);
      for (let i = 1; i < list.length; i++)
        expect(list[i - 1][mode]).toBeGreaterThanOrEqual(list[i][mode]);
    }
  });
  it('форматирует русские значения', () => {
    expect(ratingText(9)).toBe('9,0');
    expect(numberText(910842)).toBe('910 842');
  });
  it('показывает ошибку HTTP и умеет повторно загрузить локальный ресурс', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true, text: async () => csv }),
    );
    await expect(loadShows()).rejects.toThrow();
    await expect(loadShows()).resolves.toHaveLength(50);
    vi.unstubAllGlobals();
  });
});

it('переводит сетевые ошибки на русский язык', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
  await expect(loadShows()).rejects.toThrow('Не удалось загрузить файл с сериалами.');
  vi.unstubAllGlobals();
});
