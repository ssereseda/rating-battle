import faviconUrl from '../assets/favicon-orange.png';

/** Повторно назначаем иконку после запуска, в том числе для обычного адреса сайта. */
export function refreshFavicon() {
  // Vite встраивает маленький PNG в JS как data URL: кэш старого SVG не используется.
  for (const previous of document.querySelectorAll('link[rel~="icon"]')) previous.remove();
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/png';
  icon.setAttribute('sizes', '32x32');
  icon.href = faviconUrl;
  document.head.append(icon);
}
