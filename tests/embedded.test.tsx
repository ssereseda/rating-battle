import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { loadShows } from '../src/lib/data';
import { Poster } from '../src/components/Poster';
import { csv, shows } from './fixtures';
afterEach(() => {
  cleanup();
  document.querySelectorAll('[id^="rating-battle-"]').forEach((el) => el.remove());
  vi.unstubAllGlobals();
});
function embed(id: string, value: unknown) {
  const el = document.createElement('script');
  el.id = id;
  el.type = 'application/json';
  el.textContent = JSON.stringify(value);
  document.head.append(el);
}
it('автономная версия загружает весь исходный CSV без сети', async () => {
  const fetch = vi.fn().mockRejectedValue(new Error('Сеть выключена'));
  vi.stubGlobal('fetch', fetch);
  embed('rating-battle-data', csv);
  expect(await loadShows()).toHaveLength(50);
  expect(fetch).not.toHaveBeenCalled();
});
it('автономная версия использует встроенный постер вместо сетевого URL', () => {
  const image = 'data:image/jpeg;base64,/9j/';
  embed('rating-battle-posters', { [shows[0].poster]: image });
  render(<Poster show={shows[0]} />);
  expect(screen.getByRole('img').getAttribute('src')).toBe(image);
});
