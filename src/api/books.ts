import { isBook, record } from '../lib/books';
import type { Book, Filters, SearchResult } from '../types';
import { API_BASE, ApiError, getJson } from './client';
const subjects: Record<string, string> = {
  Информатика: 'computer_science',
  Математика: 'mathematics',
  Наука: 'science',
  Инженерия: 'engineering',
  Дизайн: 'design',
};
export async function loadCatalog(signal: AbortSignal): Promise<Book[]> {
  const value = await getJson(`${import.meta.env.BASE_URL}books.json`, signal);
  if (!Array.isArray(value) || !value.every(isBook)) throw new ApiError(422, 'Не удалось прочитать каталог.');
  return value;
}
export function searchUrl(filters: Filters, page: number): string {
  let query = filters.query.trim();
  if (filters.genre) query += ` subject:${subjects[filters.genre] ?? filters.genre}`;
  if (filters.available) query += ' (ebook_access:public OR ebook_access:borrowable)';
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: '20',
    fields: 'key,title,author_name,first_publish_year,cover_i,ratings_average,ebook_access',
    lang: 'ru',
  });
  const sort = { shelf: '', title: 'title', year: 'new', rating: 'rating' }[filters.sort];
  if (sort) params.set('sort', sort);
  return `${API_BASE}/search.json?${params}`;
}
export async function searchBooks(filters: Filters, page: number, signal: AbortSignal): Promise<SearchResult> {
  if (filters.query.trim().length < 3) return { books: [], total: 0 };
  const data = await getJson(searchUrl(filters, page), signal);
  if (!record(data) || !Array.isArray(data.docs)) throw new ApiError(422, 'Библиотека вернула непонятный ответ.');
  const books = data.docs.flatMap((doc: unknown): Book[] => {
    if (!record(doc) || typeof doc.key !== 'string' || typeof doc.title !== 'string') return [];
    const key = doc.key.startsWith('/works/') ? doc.key : `/works/${doc.key}`;
    if (!/^\/works\/OL\d+W$/.test(key)) return [];
    return [
      {
        id: key,
        title: doc.title,
        author: Array.isArray(doc.author_name) ? doc.author_name.filter((name: unknown) => typeof name === 'string').join(', ') : 'Автор не указан',
        year: typeof doc.first_publish_year === 'number' ? doc.first_publish_year : 0,
        genre: filters.genre || 'Open Library',
        rating: typeof doc.ratings_average === 'number' ? Number(doc.ratings_average.toFixed(1)) : 0,
        available: doc.ebook_access === 'public' || doc.ebook_access === 'borrowable',
        keywords: '',
        description: '',
        cover: typeof doc.cover_i === 'number' ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false` : '',
        coverRatio: 0.67,
      },
    ];
  });
  return { books, total: typeof data.numFound === 'number' ? data.numFound : typeof data.num_found === 'number' ? data.num_found : books.length };
}
export async function loadDetails(book: Book, signal: AbortSignal): Promise<Book> {
  const local = book.id.startsWith('local:');
  const value = await getJson(local ? `${import.meta.env.BASE_URL}books/${book.id.slice(6)}.json` : `${API_BASE}${book.id}.json`, signal);
  if (local) {
    if (!isBook(value)) throw new ApiError(422, 'Не удалось прочитать карточку книги.');
    return value;
  }
  if (!record(value) || typeof value.title !== 'string') throw new ApiError(422, 'Не удалось прочитать карточку книги.');
  const description =
    typeof value.description === 'string'
      ? value.description
      : record(value.description) && typeof value.description.value === 'string'
        ? value.description.value
        : '';
  return { ...book, title: value.title, description };
}
