// Автономная HTML-версия хранит исходный CSV и постеры внутри документа.
// В обычной Vite-сборке этих элементов нет, поэтому используются локальный CSV и URL.
const parsed = new WeakMap<Element, unknown>();
export function embeddedData<T>(id: string): T | null {
  const element = document.getElementById(id);
  if (!element) return null;
  if (!parsed.has(element)) {
    try {
      parsed.set(element, JSON.parse(element.textContent || 'null'));
    } catch {
      throw new Error('Не удалось прочитать встроенные данные проекта.');
    }
  }
  return parsed.get(element) as T | null;
}
