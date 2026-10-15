import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Book } from '../src/types';
import { defaults, selectBooks, toggleId, isBook, pageCount } from '../src/lib/books';
import { restore } from '../src/lib/storage';

const books: Book[] = JSON.parse(readFileSync(new URL('../public/books.json', import.meta.url), 'utf8'));

test('the approved shelves contain 40 available books in five equal sections', () => {
  assert.ok(books.every(isBook));
  const displayed = selectBooks(books, defaults);
  assert.equal(displayed.length, 40);
  assert.equal(new Set(displayed.map((book) => book.id)).size, 40);
  for (const genre of new Set(displayed.map((book) => book.genre))) assert.equal(displayed.filter((book) => book.genre === genre).length, 8);
});
test('search reveals unavailable books; availability and genre filters combine', () => {
  const missing = books.find((book) => !book.available)!;
  assert.ok(selectBooks(books, { ...defaults, query: missing.title }).some((book) => book.id === missing.id));
  assert.equal(selectBooks(books, { ...defaults, query: missing.title, available: true }).length, 0);
  const filtered = selectBooks(books, { ...defaults, genre: 'Информатика', query: 'code' });
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((book) => book.genre === 'Информатика'));
});
test('wishlist preserves unavailable titles, sorts without mutating inventory', () => {
  const original = books.map((book) => book.id),
    missing = books.find((book) => !book.available)!;
  assert.equal(selectBooks(books, defaults, 'wishlist', [missing.id])[0]?.id, missing.id);
  const result = selectBooks(books, { ...defaults, sort: 'year' });
  assert.ok(result.every((book, index) => index === 0 || result[index - 1]!.year >= book.year));
  assert.deepEqual(
    books.map((book) => book.id),
    original,
  );
  const ids = ['local:1'];
  assert.deepEqual(toggleId(ids, 'local:2'), ['local:1', 'local:2']);
  assert.deepEqual(ids, ['local:1']);
});
test('old numeric ids migrate, malformed storage is discarded and duplicates removed', () => {
  const restored = restore({
    wishlist: [1, 1, 45, 46, -1, '/works/OL123W', 'bad'],
    orders: [2],
    filters: { sort: 'bad', genre: 'bad', query: 'x'.repeat(200) },
  });
  assert.deepEqual(restored.wishlist, ['local:1', 'local:45', '/works/OL123W']);
  assert.deepEqual(restored.orders, ['local:2']);
  assert.equal(restored.filters.sort, 'shelf');
  assert.equal(restored.filters.query.length, 160);
  assert.deepEqual(restore(null).wishlist, []);
  assert.equal(pageCount(41), 3);
  assert.equal(pageCount(0), 1);
});
