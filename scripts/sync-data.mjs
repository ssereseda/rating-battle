import { copyFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await mkdir(new URL('public/', root), { recursive: true });
await copyFile(
  new URL('creative_hse_2026 - kinopoisk.csv', root),
  new URL('public/creative_hse_2026 - kinopoisk.csv', root),
);
