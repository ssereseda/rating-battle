import { readFileSync } from 'node:fs';
import { parseShows } from '../src/lib/data';
export const csv = readFileSync('creative_hse_2026 - kinopoisk.csv', 'utf-8');
export const shows = parseShows(csv);
