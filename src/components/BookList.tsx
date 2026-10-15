import type { Book, BookActions, Sort, View } from '../types';
import { genres } from '../lib/books';
import { BookCard } from './BookCard';
import { ShelfGroup } from './ShelfGroup';
import shelf from '../../assets/shelf.webp';
interface BookListProps extends BookActions {
  books: Book[];
  sort: Sort;
  view: View;
  wishlist: string[];
  orders: string[];
  hiddenId: string | null;
  columns: number;
}
export function BookList({ books, sort, view, wishlist, orders, hiddenId, columns, ...actions }: BookListProps) {
  const groupNames =
    sort === 'shelf'
      ? [...genres, ...new Set(books.map((book) => book.genre).filter((genre) => !genres.includes(genre)))]
      : [{ title: 'По названию', year: 'Сначала новые', rating: 'По рейтингу' }[sort]];
  return (
    <div id="shelves">
      {groupNames.map((genre) => {
        const items = sort === 'shelf' ? books.filter((book) => book.genre === genre) : books;
        if (!items.length) return null;
        const rows: Book[][] = [];
        for (let index = 0; index < items.length; index += columns) rows.push(items.slice(index, index + columns));
        return (
          <ShelfGroup key={genre} title={genre}>
            {rows.map((row) => (
              <div className="shelf-row" key={row[0]?.id}>
                {row.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    saved={wishlist.includes(book.id)}
                    ordered={orders.includes(book.id)}
                    selected={hiddenId === book.id}
                    removable={view === 'orders'}
                    {...actions}
                  />
                ))}
                <div className="shelf-board" aria-hidden="true">
                  <img src={shelf} alt="" />
                </div>
              </div>
            ))}
          </ShelfGroup>
        );
      })}
    </div>
  );
}
