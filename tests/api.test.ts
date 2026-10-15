import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaults } from '../src/lib/books';
import { ApiError, getJson } from '../src/api/client';
import { searchBooks, searchUrl, loadDetails } from '../src/api/books';

test('search safely encodes filters and requests exactly 20 records per page', () => {
  const url = new URL(searchUrl({ ...defaults, query: 'C++ & React', genre: 'Информатика', available: true, sort: 'year' }, 3));
  assert.equal(url.origin, 'https://openlibrary.org');
  assert.equal(url.searchParams.get('page'), '3');
  assert.equal(url.searchParams.get('limit'), '20');
  assert.ok(url.searchParams.get('q')?.includes('C++ & React subject:computer_science'));
  assert.ok(url.searchParams.get('q')?.includes('ebook_access:public'));
});
test('API maps public responses, skips malformed entries and fetches separate work details', async (context) => {
  const calls: string[] = [];
  context.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return Response.json(
      calls.length === 1
        ? {
            numFound: 42,
            docs: [
              { key: '/works/OL123W', title: 'React', author_name: ['Author'], first_publish_year: 2020, ebook_access: 'borrowable', ratings_average: 4.15 },
              { key: 'bad', title: 'Invalid' },
            ],
          }
        : { title: 'React', description: { value: 'Full work description' } },
    );
  });
  const signal = new AbortController().signal;
  const result = await searchBooks({ ...defaults, query: 'React' }, 2, signal);
  assert.equal(result.total, 42);
  assert.equal(result.books.length, 1);
  assert.equal(result.books[0]?.available, true);
  const detail = await loadDetails(result.books[0]!, signal);
  assert.equal(detail.description, 'Full work description');
  assert.equal(calls[1], 'https://openlibrary.org/works/OL123W.json');
});
test('short queries make no network request', async (context) => {
  const fetch = context.mock.method(globalThis, 'fetch', () => {
    throw Error('Must not fetch');
  });
  assert.deepEqual(await searchBooks({ ...defaults, query: 'ab' }, 1, new AbortController().signal), { books: [], total: 0 });
  assert.equal(fetch.mock.callCount(), 0);
});
test('404, 4xx and 5xx keep their status and different actionable messages', async (context) => {
  const messages: string[] = [];
  for (const status of [404, 429, 503]) {
    const mock = context.mock.method(globalThis, 'fetch', async () => new Response('', { status }));
    await assert.rejects(getJson('https://openlibrary.org/test', new AbortController().signal), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, status);
      messages.push(error.message);
      return true;
    });
    mock.mock.restore();
  }
  assert.equal(new Set(messages).size, 3);
});
test('network failures are actionable; cancellation remains AbortError', async (context) => {
  const mock = context.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(
    getJson('https://openlibrary.org/test', new AbortController().signal),
    (error: unknown) => error instanceof ApiError && error.status === 0,
  );
  mock.mock.restore();
  context.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, options?: RequestInit) => {
    options?.signal?.throwIfAborted();
    throw Error('Unexpected');
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(getJson('https://openlibrary.org/test', controller.signal), { name: 'AbortError' });
});
