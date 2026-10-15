import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Book, Filters, Resource, SearchResult, Selection, View } from './types';
import { bookCount, defaults, pageCount, selectBooks } from './lib/books';
import { loadCatalog, searchBooks } from './api/books';
import { useLibrary } from './hooks/useLibrary';
import { useDebouncedValue, useResource } from './hooks/useResource';
import { Header } from './components/Header';
import { FiltersPanel } from './components/FiltersPanel';
import { Catalog } from './components/Catalog';
import { BookDialog } from './components/BookDialog';
const subscribe = (notify: () => void) => {
  const media = matchMedia('(max-width:650px)');
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const getColumns = () => (matchMedia('(max-width:650px)').matches ? 2 : 4);
export default function App() {
  const { library, storageError, setFilters, wish, order, remove } = useLibrary();
  const { filters, wishlist, orders, savedBooks } = library;
  const [view, setView] = useState<View>('catalog'),
    [page, setPage] = useState(1),
    [selection, setSelection] = useState<Selection | null>(null),
    [hiddenId, setHiddenId] = useState<string | null>(null);
  const search = useRef<HTMLInputElement>(null),
    main = useRef<HTMLElement>(null);
  const columns = useSyncExternalStore(subscribe, getColumns, () => 4);
  const [inventory, retryLocal] = useResource(loadCatalog);
  const query = useDebouncedValue(filters.query);
  const external = view === 'catalog' && filters.source === 'openlibrary';
  const remoteLoader = useCallback(
    (signal: AbortSignal) =>
      external && query === filters.query ? searchBooks({ ...filters, query }, page, signal) : Promise.resolve({ books: [], total: 0 }),
    [external, query, filters, page],
  );
  const [remote, retryRemote] = useResource(remoteLoader);
  const pool = [...new Map([...savedBooks, ...(inventory.status === 'success' ? inventory.data : [])].map((book) => [book.id, book])).values()];
  const catalog = inventory.status === 'success' ? inventory.data : [];
  const selected = selectBooks(view === 'catalog' ? catalog : pool, filters, view, wishlist, orders);
  const size = view === 'catalog' && !filters.query && filters.sort === 'shelf' ? 40 : 20;
  const currentPage = external ? page : Math.min(page, pageCount(selected.length, size));
  const local: Resource<SearchResult> =
    inventory.status === 'success' || (view !== 'catalog' && selected.length > 0)
      ? { status: 'success', data: { books: selected.slice((currentPage - 1) * size, currentPage * size), total: selected.length } }
      : inventory;
  const resource: Resource<SearchResult> = external ? (query !== filters.query ? { status: 'loading' } : remote) : local;
  const total = resource.status === 'success' ? resource.data.total : 0,
    pages = pageCount(total, external ? 20 : size);
  function change(next: Filters) {
    setFilters(next);
    setPage(1);
  }
  function navigate(next: View) {
    setView(next);
    change({ ...defaults });
  }
  function open(book: Book, origin: HTMLButtonElement) {
    const cover = origin.firstElementChild;
    if (!cover) return;
    setSelection({ book, origin, rect: cover.getBoundingClientRect() });
    setHiddenId(book.id);
  }
  function close() {
    const origin = selection?.origin;
    setSelection(null);
    setHiddenId(null);
    requestAnimationFrame(() => {
      if (origin?.isConnected) origin.focus({ preventScroll: true });
    });
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !selection) {
        event.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [selection]);
  return (
    <>
      <a className="skip-link" href="#main">
        К содержанию
      </a>
      <Header view={view} wishes={wishlist.length} orders={orders.length} blocked={!!selection} onView={navigate} />
      <main id="main" ref={main} inert={!!selection}>
        <section className="collection" aria-labelledby="collection-title">
          <FiltersPanel filters={filters} onChange={change} onReset={() => navigate('catalog')} searchRef={search} catalog={view === 'catalog'} />
          <div className="collection-heading">
            <h1 id="collection-title">{{ catalog: 'Каталог', wishlist: 'Мой список', orders: 'Корзина' }[view]}</h1>
            <p role="status" aria-live="polite">
              {resource.status === 'success' && bookCount(total)}
            </p>
          </div>
          <Catalog
            resource={resource}
            onRetry={external ? retryRemote : retryLocal}
            onReset={() => navigate('catalog')}
            external={external}
            shortQuery={external && filters.query.trim().length < 3}
            page={currentPage}
            pages={pages}
            onPage={(next) => {
              setPage(next);
              main.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
            }}
            sort={filters.sort}
            view={view}
            wishlist={wishlist}
            orders={orders}
            hiddenId={hiddenId}
            columns={columns}
            onOpen={open}
            onWish={wish}
            onRemove={remove}
          />
        </section>
      </main>
      {selection && (
        <BookDialog
          key={selection.book.id}
          selection={selection}
          saved={wishlist.includes(selection.book.id)}
          ordered={orders.includes(selection.book.id)}
          onWish={wish}
          onOrder={order}
          onReveal={() => setHiddenId(null)}
          onClose={close}
        />
      )}
      <p className="notice" role="status">
        {storageError ? 'Хранилище недоступно. Выбор сохранён до закрытия страницы.' : ''}
      </p>
    </>
  );
}
