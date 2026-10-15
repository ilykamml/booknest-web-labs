import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Book, Phase, Selection } from '../types';
import { loadDetails } from '../api/books';
import { useResource } from '../hooks/useResource';
import { openBook, closeBook, checkout } from '../lib/motion';
import { BookCover } from './BookCover';
import { Badge, Button, ErrorBox, Spinner } from './Controls';
import { MotionStage } from './MotionStage';
interface BookDialogProps {
  selection: Selection;
  saved: boolean;
  ordered: boolean;
  onWish: (book: Book) => void;
  onOrder: (book: Book) => void;
  onReveal: () => void;
  onClose: () => void;
}
export function BookDialog({ selection, saved, ordered, onWish, onOrder, onReveal, onClose }: BookDialogProps) {
  const [phase, setPhase] = useState<Phase>('opening');
  const modal = useRef<HTMLDialogElement>(null),
    cover = useRef<HTMLSpanElement>(null),
    copy = useRef<HTMLDivElement>(null),
    orderButton = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLDivElement>(null),
    basket = useRef<HTMLImageElement>(null),
    effects = useRef<HTMLDivElement>(null),
    closeButton = useRef<HTMLButtonElement>(null);
  const opening = useRef<Promise<void>>(Promise.resolve()),
    closing = useRef(false);
  const loader = useCallback((signal: AbortSignal) => loadDetails(selection.book, signal), [selection.book]);
  const [resource, retry] = useResource(loader);
  const book = resource.status === 'success' ? resource.data : selection.book;
  useLayoutEffect(() => {
    const dialog = modal.current,
      target = cover.current,
      source = selection.origin.firstElementChild,
      right = copy.current;
    if (!dialog || !target || !(source instanceof HTMLElement) || !right) return;
    let active = true;
    dialog.showModal();
    opening.current = openBook(source, target, dialog, right, selection.rect).then(() => {
      if (active) {
        setPhase('idle');
        closeButton.current?.focus();
      }
    });
    return () => {
      active = false;
      dialog.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      dialog.close();
    };
  }, [selection]);
  async function close() {
    if (phase === 'ordering' || closing.current) return;
    closing.current = true;
    await opening.current;
    setPhase('closing');
    const source = cover.current,
      target = selection.origin.firstElementChild;
    if (source && target instanceof HTMLElement && modal.current && effects.current) await closeBook(source, target, modal.current, effects.current);
    onClose();
  }
  async function order() {
    if (phase !== 'idle' || !book.available || ordered || !orderButton.current) return;
    const button = orderButton.current.getBoundingClientRect();
    flushSync(() => {
      setPhase('ordering');
      onOrder(book);
    });
    if (cover.current && modal.current && stage.current && basket.current && effects.current) {
      try {
        await checkout({ source: cover.current, button, dialog: modal.current, stage: stage.current, basket: basket.current, effects: effects.current }, () =>
          flushSync(onReveal),
        );
      } finally {
        onClose();
      }
    }
  }
  return (
    <>
      <dialog
        ref={modal}
        aria-labelledby="detail-title"
        onCancel={(event) => {
          event.preventDefault();
          void close();
        }}
      >
        <div className="detail-toolbar">
          <span />
          <Button ref={closeButton} className="icon-button" onClick={() => void close()} aria-label="Закрыть карточку">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </Button>
        </div>
        <article className="detail-layout">
          <div className="detail-cover">
            <BookCover book={selection.book} ordered={ordered} jacketRef={cover} />
          </div>
          <div className="detail-copy" ref={copy}>
            <p className="eyebrow">{book.genre}</p>
            <h2 id="detail-title">{book.title}</h2>
            <p className="detail-author">{book.author}</p>
            {resource.status === 'loading' ? (
              <Spinner label="Загружаем описание…" />
            ) : resource.status === 'error' ? (
              <ErrorBox error={resource.error} onRetry={retry} />
            ) : (
              <>
                {book.description && <p className="detail-description">{book.description}</p>}
                <div className="book-facts">
                  <span>
                    <small>Год</small>
                    <span>{book.year || 'Не указан'}</span>
                  </span>
                  <span>
                    <small>Рейтинг</small>
                    <Badge>{book.rating ? `${book.rating} из 5` : 'Нет оценок'}</Badge>
                  </span>
                </div>
                <Button ref={orderButton} className="primary-button" disabled={ordered || !book.available || phase !== 'idle'} onClick={() => void order()}>
                  {ordered ? 'Уже в корзине' : book.available ? 'Заказать книгу' : 'Сейчас нет на полке'}
                </Button>
              </>
            )}
            <Button className="secondary-button" aria-pressed={saved} onClick={() => onWish(book)}>
              {saved ? '♥ В моём списке' : '♡ Хочу прочитать'}
            </Button>
          </div>
        </article>
      </dialog>
      <MotionStage ordering={phase === 'ordering'} stageRef={stage} basketRef={basket} effectsRef={effects} />
    </>
  );
}
