import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { Ranking } from '../src/components/Ranking';
import { Poster } from '../src/components/Poster';
import { Modal } from '../src/components/Modal';
import { csv, shows } from './fixtures';
import App from '../src/App';
import { sortShows } from '../src/lib/data';
import { STORAGE_KEY } from '../src/lib/storage';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => csv }));
});
describe('Интерактивный рейтинг всех сериалов', () => {
  it('отображает все 50, раскрывает CSV-сведения и безопасную ссылку', async () => {
    const user = userEvent.setup();
    render(<Ranking shows={shows} />);
    expect(screen.getAllByRole('article')).toHaveLength(50);
    const row = screen.getAllByRole('article')[0];
    expect(row.textContent).toContain(sortShows(shows, 'rating')[0].title);
    await user.click(within(row).getByRole('button'));
    expect(within(row).getByText('Режиссёр')).toBeTruthy();
    expect(within(row).getByRole('link').getAttribute('href')).toBe(
      sortShows(shows, 'rating')[0].url,
    );
    expect(within(row).getByRole('link').getAttribute('rel')).toBe('noopener noreferrer');
  });
  it('ищет названия и восстанавливает все 50 после очистки', async () => {
    const user = userEvent.setup();
    render(<Ranking shows={shows} />);
    await user.type(screen.getByRole('searchbox'), 'во все тяжкие');
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
    expect(screen.getByRole('article').textContent).toContain('Во все тяжкие');
    await user.click(screen.getByRole('button', { name: 'Очистить поиск' }));
    expect(screen.getAllByRole('article')).toHaveLength(50);
  });
  it('сортирует по голосам и году, пересчитывает видимые позиции', async () => {
    const user = userEvent.setup();
    render(<Ranking shows={shows} />);
    const select = screen.getByRole('combobox');
    for (const mode of ['votes', 'year'] as const) {
      await user.selectOptions(select, mode);
      const rows = screen.getAllByRole('article');
      expect(rows[0].textContent).toContain(sortShows(shows, mode)[0].title);
      expect(rows[0].querySelector('.rank-position')?.textContent).toBe('01');
      expect(rows[49].querySelector('.rank-position')?.textContent).toBe('50');
    }
  });
  it('показывает пустой поиск и позволяет восстановить рейтинг', async () => {
    const user = userEvent.setup();
    render(<Ranking shows={shows} />);
    await user.type(screen.getByRole('searchbox'), 'несуществующий');
    expect(screen.getByText('Такого сериала в списке нет')).toBeTruthy();
    await user.click(screen.getAllByRole('button', { name: 'Очистить поиск' })[0]);
    expect(screen.getAllByRole('article')).toHaveLength(50);
  });
});
describe('Доступность и изображения', () => {
  it('показывает название и плёнку при недоступном постере', () => {
    render(<Poster show={shows[0]} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText(shows[0].title)).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });
  it('закрывает диалог по Escape и возвращает фокус', async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const view = render(
      <Modal title="Правила" onClose={close}>
        <button>Далее</button>
      </Modal>,
    );
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Закрыть окно');
    await user.keyboard('{Escape}');
    expect(close).toHaveBeenCalledOnce();
    view.unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
  it('удерживает фокус внутри диалога', async () => {
    const user = userEvent.setup();
    render(
      <Modal title="Правила" onClose={() => {}}>
        <button>Далее</button>
      </Modal>,
    );
    await user.tab({ shift: true });
    expect(document.activeElement?.textContent).toBe('Далее');
    await user.tab();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Закрыть окно');
  });
});
describe('Полная пользовательская сессия', () => {
  it('правила, игра, бонусы, завершение, рейтинг, повтор и сохранение', async () => {
    const user = userEvent.setup();
    const view = render(
      <MotionConfig reducedMotion="always">
        <App />
      </MotionConfig>,
    );
    await screen.findByRole('button', { name: /^ИГРАТЬ$/ });
    await user.click(screen.getAllByRole('button', { name: 'Как играть' })[0]);
    expect(screen.getByRole('dialog')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'ПОНЯТНО, ИГРАТЬ!' }));
    await screen.findByRole('button', { name: 'ВЫШЕ' });
    await user.click(screen.getByRole('button', { name: /Подсказка/ }));
    expect(screen.getByText(/Рейтинг находится между/)).toBeTruthy();
    const swap = screen.getByRole('button', { name: /Замена/ });
    await user.click(swap);
    expect(swap.textContent).toContain('1/2');
    await waitFor(() => expect(swap.hasAttribute('disabled')).toBe(false));
    await user.click(swap);
    expect(swap.hasAttribute('disabled')).toBe(true);
    // Читаем текущие названия в реальном интерфейсе, сравниваем с исходным CSV.
    for (let round = 0; round < 3; round++) {
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'ВЫШЕ' }).hasAttribute('disabled')).toBe(false);
        expect(document.querySelectorAll('.battle-card')).toHaveLength(2);
      });
      const cards = document.querySelectorAll('.battle-card');
      const left = shows.find((s) => s.title === cards[0].querySelector('h2')?.textContent)!;
      const right = shows.find((s) => s.title === cards[1].querySelector('h2')?.textContent)!;
      const wrong = right.rating > left.rating ? 'НИЖЕ' : 'ВЫШЕ';
      await user.click(screen.getByRole('button', { name: wrong }));
      expect(screen.getByText('НЕВЕРНО! −1 ЖИЗНЬ')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Подсказка/ }).hasAttribute('disabled')).toBe(true);
      await user.click(
        screen.getByRole('button', { name: round === 2 ? 'К РЕЗУЛЬТАТАМ' : 'СЛЕДУЮЩИЙ РАУНД' }),
      );
      if (round < 2) await screen.findByRole('button', { name: 'ВЫШЕ' });
    }
    await screen.findByRole('heading', { name: 'ИГРА ОКОНЧЕНА' });
    expect(screen.getByRole('heading', { name: 'РЕЙТИНГ СЕРИАЛОВ' })).toBeTruthy();
    expect(screen.getAllByRole('article')).toHaveLength(50);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).games).toBe(1);
    await user.click(screen.getByRole('button', { name: 'СЫГРАТЬ ЕЩЁ' }));
    await screen.findByRole('button', { name: 'ВЫШЕ' });
    expect(screen.getByLabelText('Осталось жизней: 3')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Подсказка/ }).textContent).toContain('1/1');
    await user.click(screen.getByRole('button', { name: 'На главную' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Остаться' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await user.click(screen.getByRole('button', { name: 'На главную' }));
    await user.click(screen.getByRole('button', { name: 'Выйти' }));
    await screen.findByRole('button', { name: /^ИГРАТЬ$/ });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).games).toBe(1);
    view.unmount();
    render(<App />);
    await screen.findByRole('button', { name: /^ИГРАТЬ$/ });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).games).toBe(1);
  }, 20000);
  it('ошибка загрузки предлагает рабочую повторную попытку', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('Ошибка сети'))
        .mockResolvedValue({ ok: true, text: async () => csv }),
    );
    render(<App />);
    await screen.findByText('Не удалось загрузить сериалы');
    await user.click(screen.getByRole('button', { name: 'Повторить попытку' }));
    expect(await screen.findByRole('button', { name: /^ИГРАТЬ$/ })).toBeTruthy();
  });
});
