import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { animateShelf } from '../lib/motion';
interface ShelfGroupProps {
  title: string;
  children: ReactNode;
}
export function ShelfGroup({ title, children }: ShelfGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const group = useRef<HTMLDetailsElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  async function toggle() {
    if (!group.current || !content.current || busy.current) return;
    busy.current = true;
    group.current.open = true;
    await animateShelf(content.current, !expanded);
    setExpanded(!expanded);
    busy.current = false;
  }
  return (
    <details className="shelf-group" open={expanded} ref={group}>
      <summary
        onClick={(event) => {
          event.preventDefault();
          void toggle();
        }}
      >
        <h2>{title}</h2>
      </summary>
      <div className="shelf-content" ref={content}>
        {children}
      </div>
    </details>
  );
}
