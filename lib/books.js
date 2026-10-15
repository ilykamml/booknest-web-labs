export const defaults = { query: '', genre: '', available: false, sort: 'shelf' };
const normalize = value => value.toLocaleLowerCase('ru').normalize('NFD').replace(/\p{Diacritic}/gu, '');

export function selectBooks(books, filters, view = 'catalog', wishlist = [], orders = []) {
  const query = normalize(filters.query.trim());
  const selected = books.filter(book => {
    if (view === 'wishlist' && !wishlist.includes(book.id)) return false;
    if (view === 'orders' && !orders.includes(book.id)) return false;
    if (!query && !book.available && view === 'catalog') return false;
    return (!query || normalize(`${book.title} ${book.author} ${book.keywords}`).includes(query))
      && (!filters.genre || filters.genre === book.genre)
      && (!filters.available || book.available);
  });
  const compare = {
    title: (a, b) => a.title.localeCompare(b.title, 'en'),
    year: (a, b) => b.year - a.year,
    rating: (a, b) => b.rating - a.rating,
    shelf: (a, b) => a.id - b.id,
  }[filters.sort] ?? ((a, b) => a.id - b.id);
  return [...selected].sort(compare);
}

export function toggleId(ids, id) {
  return ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];
}

export function restore(value, validIds, genres) {
  const raw = value && typeof value === 'object' ? value : {};
  const filters = raw.filters && typeof raw.filters === 'object' ? raw.filters : {};
  const ids = list => [...new Set(Array.isArray(list) ? list.filter(id => validIds.includes(id)) : [])];
  return {
    filters: {
      query: typeof filters.query === 'string' ? filters.query.slice(0, 160) : '',
      genre: genres.includes(filters.genre) ? filters.genre : '',
      available: filters.available === true,
      sort: ['shelf','title','year','rating'].includes(filters.sort) ? filters.sort : 'shelf',
    },
    wishlist: ids(raw.wishlist), orders: ids(raw.orders),
  };
}
