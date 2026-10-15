import { defaults, genres, isBook, record } from './books';
import type { Library, Sort } from '../types';
const sorts: Sort[] = ['shelf', 'title', 'year', 'rating'];
export function restore(value: unknown): Library {
  const raw = record(value) ? value : {};
  const filters = record(raw.filters) ? raw.filters : {};
  const ids = (value: unknown): string[] => [
    ...new Set(
      (Array.isArray(value) ? value : []).flatMap((id: unknown) => {
        if (typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 45) return [`local:${id}`];
        return typeof id === 'string' && /^(local:([1-9]|[1-3]\d|4[0-5])|\/works\/OL\d+W)$/.test(id) ? [id] : [];
      }),
    ),
  ];
  return {
    filters: {
      ...defaults,
      query: typeof filters.query === 'string' ? filters.query.slice(0, 160) : '',
      genre: typeof filters.genre === 'string' && genres.includes(filters.genre) ? filters.genre : '',
      available: filters.available === true,
      sort: sorts.includes(filters.sort as Sort) ? (filters.sort as Sort) : 'shelf',
      source: filters.source === 'openlibrary' ? 'openlibrary' : 'local',
    },
    wishlist: ids(raw.wishlist),
    orders: ids(raw.orders),
    savedBooks: Array.isArray(raw.savedBooks) ? raw.savedBooks.filter(isBook) : [],
  };
}
export function readLibrary(): Library {
  try {
    return restore(JSON.parse(localStorage.getItem('booknest-v5') ?? localStorage.getItem('booknest-v3') ?? 'null'));
  } catch {
    return restore(null);
  }
}
