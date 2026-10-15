import type { View } from '../types';
import { Badge, Button } from './Controls';
interface HeaderProps {
  view: View;
  wishes: number;
  orders: number;
  blocked: boolean;
  onView: (view: View) => void;
}
export function Header({ view, wishes, orders, blocked, onView }: HeaderProps) {
  return (
    <header className="site-header" inert={blocked}>
      <a
        className="brand"
        href="./"
        onClick={(event) => {
          event.preventDefault();
          onView('catalog');
        }}
      >
        BookNest
      </a>
      <nav className="site-nav" aria-label="Основная навигация">
        <Button onClick={() => onView('catalog')} aria-current={view === 'catalog' ? 'page' : undefined}>
          Каталог
        </Button>
        <Button onClick={() => onView('wishlist')} aria-current={view === 'wishlist' ? 'page' : undefined}>
          Мой список <Badge>{wishes}</Badge>
        </Button>
        <Button onClick={() => onView('orders')} aria-current={view === 'orders' ? 'page' : undefined}>
          Корзина <Badge>{orders}</Badge>
        </Button>
      </nav>
    </header>
  );
}
