import { useState } from 'react';
import type { CSSProperties, Ref } from 'react';
import type { Book } from '../types';
const covers = import.meta.glob<string>('../../assets/covers/*.jpg', { eager: true, query: '?url', import: 'default' });
interface BookCoverProps {
  book: Book;
  ordered: boolean;
  jacketRef?: Ref<HTMLSpanElement>;
}
export function BookCover({ book, ordered, jacketRef }: BookCoverProps) {
  const [ratio, setRatio] = useState(book.coverRatio),
    [failed, setFailed] = useState(false);
  const src = book.cover.startsWith('local:') ? covers[`../../assets/covers/${book.cover.slice(6)}.jpg`] : book.cover;
  return (
    <span className="book-jacket" ref={jacketRef} style={{ '--cover-ratio': ratio } as CSSProperties}>
      <span className="cover-placeholder" aria-hidden="true">
        {book.title}
      </span>
      {src && !failed && (
        <img
          src={src}
          alt=""
          width={Math.round(book.coverRatio * 500)}
          height={500}
          decoding="async"
          onLoad={(event) => {
            if (!book.cover.startsWith('local:')) setRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight);
          }}
          onError={() => setFailed(true)}
        />
      )}
      <span className="order-ribbon" hidden={!ordered} aria-hidden="true">
        <span>Заказана</span>
      </span>
    </span>
  );
}
