import { Button } from './Controls';
interface PaginationProps {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}
export function Pagination({ page, pages, onPage }: PaginationProps) {
  if (pages < 2) return null;
  return (
    <nav className="pagination" aria-label="Страницы каталога">
      <Button className="secondary-button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Назад
      </Button>
      <span aria-live="polite">
        Страница {page} из {pages}
      </span>
      <Button className="secondary-button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Далее
      </Button>
    </nav>
  );
}
