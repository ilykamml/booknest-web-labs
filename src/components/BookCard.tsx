import type { Book, BookActions } from '../types';
import { BookCover } from './BookCover';
import { Button } from './Controls';
interface BookCardProps extends BookActions {
  book: Book;
  saved: boolean;
  ordered: boolean;
  selected: boolean;
  removable: boolean;
}
export function BookCard({ book, saved, ordered, selected, removable, onOpen, onWish, onRemove }: BookCardProps) {
  return (
    <article data-book={book.id} className={`book-card${book.available ? '' : ' book-unavailable'}${selected ? ' is-selected' : ''}`}>
      <Button className="book-open" aria-label={`Открыть ${book.title}${ordered ? ', заказана' : ''}`} onClick={(event) => onOpen(book, event.currentTarget)}>
        <BookCover book={book} ordered={ordered} />
      </Button>
      <div className="book-meta">
        <div className="book-label">
          <h3>{book.title}</h3>
          <p>{book.author.split(',')[0]}</p>
        </div>
        <Button
          className="wish-button"
          aria-pressed={saved}
          aria-label={`${saved ? 'Удалить из списка' : 'Хочу прочитать'}: ${book.title}`}
          onClick={() => onWish(book)}
        >
          {saved ? '♥' : '♡'}
        </Button>
        {removable && (
          <Button className="secondary-button" onClick={() => onRemove(book.id)}>
            Убрать
          </Button>
        )}
      </div>
    </article>
  );
}
