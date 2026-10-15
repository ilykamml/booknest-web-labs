export type View = 'catalog' | 'wishlist' | 'orders';
export type Source = 'local' | 'openlibrary';
export type Sort = 'shelf' | 'title' | 'year' | 'rating';
export type Phase = 'opening' | 'idle' | 'closing' | 'ordering';
export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: string;
  rating: number;
  available: boolean;
  keywords: string;
  description: string;
  cover: string;
  coverRatio: number;
}
export interface Filters {
  query: string;
  genre: string;
  available: boolean;
  sort: Sort;
  source: Source;
}
export interface Library {
  filters: Filters;
  wishlist: string[];
  orders: string[];
  savedBooks: Book[];
}
export interface SearchResult {
  books: Book[];
  total: number;
}
export type Resource<T> = { status: 'loading' } | { status: 'success'; data: T } | { status: 'empty' } | { status: 'error'; error: Error };
export interface Selection {
  book: Book;
  origin: HTMLButtonElement;
  rect: DOMRect;
}
export interface BookActions {
  onOpen: (book: Book, origin: HTMLButtonElement) => void;
  onWish: (book: Book) => void;
  onRemove: (id: string) => void;
}
