import type { Book, Filters, View } from '../types';
export const genres = ['Информатика', 'Математика', 'Наука', 'Инженерия', 'Дизайн'];
export const defaults: Filters = { query: '', genre: '', available: false, sort: 'shelf', source: 'local' };
const normalize = (value: string) =>
  value
    .toLocaleLowerCase('ru')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
export function selectBooks(books: Book[], filters: Filters, view: View = 'catalog', wishlist: string[] = [], orders: string[] = []): Book[] {
  const query = normalize(filters.query.trim());
  const result = books.filter(
    (book) =>
      (view !== 'wishlist' || wishlist.includes(book.id)) &&
      (view !== 'orders' || orders.includes(book.id)) &&
      (view !== 'catalog' || !!query || book.available) &&
      (!query || normalize(`${book.title} ${book.author} ${book.keywords}`).includes(query)) &&
      (!filters.genre || filters.genre === book.genre) &&
      (!filters.available || book.available),
  );
  const compare: Record<Filters['sort'], (a: Book, b: Book) => number> = {
    title: (a, b) => a.title.localeCompare(b.title, 'en'),
    year: (a, b) => b.year - a.year,
    rating: (a, b) => b.rating - a.rating,
    shelf: () => 0,
  };
  return result.sort(compare[filters.sort]);
}
export const toggleId = (ids: string[], id: string): string[] => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
export const pageCount = (total: number, size = 20) => Math.max(1, Math.ceil(total / size));
const plurals = new Intl.PluralRules('ru');
export const bookCount = (total: number) =>
  `${total.toLocaleString('ru')} ${{ one: 'книга', few: 'книги', many: 'книг', other: 'книги' }[plurals.select(total) as 'one' | 'few' | 'many' | 'other']}`;
export const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
export function isBook(value: unknown): value is Book {
  return (
    record(value) &&
    ['id', 'title', 'author', 'genre', 'keywords', 'description', 'cover'].every((key) => typeof value[key] === 'string') &&
    ['year', 'rating', 'coverRatio'].every((key) => typeof value[key] === 'number' && Number.isFinite(value[key])) &&
    typeof value.available === 'boolean'
  );
}
