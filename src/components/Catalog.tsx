import type { ComponentProps } from 'react';
import type { Resource, SearchResult } from '../types';
import { BookList } from './BookList';
import { Pagination } from './Pagination';
import { EmptyState, ErrorBox, Spinner } from './Controls';
interface CatalogProps extends Omit<ComponentProps<typeof BookList>, 'books'> {
  resource: Resource<SearchResult>;
  onRetry: () => void;
  onReset: () => void;
  external: boolean;
  shortQuery: boolean;
  page: number;
  pages: number;
  onPage: (page: number) => void;
}
export function Catalog({ resource, onRetry, onReset, external, shortQuery, page, pages, onPage, ...list }: CatalogProps) {
  if (shortQuery) return <EmptyState title="Поиск в Open Library" message="Введите название или автора — не менее трёх символов." />;
  if (resource.status === 'loading') return <Spinner />;
  if (resource.status === 'error') return <ErrorBox error={resource.error} onRetry={onRetry} />;
  if (resource.status === 'empty' || (resource.status === 'success' && !resource.data.books.length))
    return external ? (
      <EmptyState title="Ничего не найдено" message="Попробуйте другое название или имя автора." onReset={onReset} />
    ) : (
      <EmptyState
        title={list.view === 'wishlist' ? 'Список пуст' : list.view === 'orders' ? 'Корзина пуста' : 'Ничего не найдено'}
        message="Измените поиск или вернитесь в каталог."
        onReset={onReset}
      />
    );
  return (
    <>
      <BookList {...list} books={resource.data.books} />
      <Pagination page={page} pages={pages} onPage={onPage} />
    </>
  );
}
