import { useEffect, useState } from 'react';
import type { Book, Filters } from '../types';
import { toggleId } from '../lib/books';
import { readLibrary } from '../lib/storage';
export function useLibrary() {
  const [library, setLibrary] = useState(readLibrary);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem('booknest-v5', JSON.stringify(library));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [library]);
  function remember(book: Book, kind: 'wishlist' | 'orders') {
    setLibrary((previous) => ({
      ...previous,
      [kind]: kind === 'wishlist' ? toggleId(previous.wishlist, book.id) : previous.orders.includes(book.id) ? previous.orders : [...previous.orders, book.id],
      savedBooks: [...previous.savedBooks.filter((item) => item.id !== book.id), book],
    }));
  }
  return {
    library,
    storageError,
    setFilters: (filters: Filters) => setLibrary((previous) => ({ ...previous, filters })),
    wish: (book: Book) => remember(book, 'wishlist'),
    order: (book: Book) => remember(book, 'orders'),
    remove: (id: string) => setLibrary((previous) => ({ ...previous, orders: previous.orders.filter((item) => item !== id) })),
  };
}
