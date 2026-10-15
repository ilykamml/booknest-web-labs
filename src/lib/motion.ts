const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = 'cubic-bezier(.22,.85,.22,1)';
const animate = (node: HTMLElement, frames: Keyframe[], duration: number, options: KeyframeAnimationOptions = {}) =>
  node.animate(frames, { duration, easing: ease, fill: 'both', ...options }).finished.catch(() => {});
function flyer(source: HTMLElement, rect: DOMRect, host: HTMLElement): HTMLDivElement {
  const node = source.ownerDocument.createElement('div');
  node.className = 'flying-book';
  node.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
  node.append(source.cloneNode(true));
  host.append(node);
  return node;
}
export async function openBook(source: HTMLElement, target: HTMLElement, dialog: HTMLDialogElement, copy: HTMLElement, start: DOMRect) {
  if (reduced()) return;
  const end = target.getBoundingClientRect(),
    ghost = flyer(source, start, dialog);
  target.style.visibility = 'hidden';
  try {
    await Promise.all([
      animate(
        ghost,
        [
          { transform: 'translate(0,0) scale(1)' },
          { transform: `translate(${end.left - start.left}px,${end.top - start.top}px) scale(${end.width / start.width})` },
        ],
        650,
      ),
      animate(
        copy,
        [
          { opacity: 0, transform: 'translateX(18px)' },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        420,
        { delay: 150 },
      ),
    ]);
  } finally {
    target.style.visibility = '';
    ghost.remove();
  }
}
export async function closeBook(source: HTMLElement, target: HTMLElement, dialog: HTMLDialogElement, effects: HTMLElement) {
  if (reduced()) {
    dialog.close();
    return;
  }
  const start = source.getBoundingClientRect(),
    end = target.getBoundingClientRect(),
    ghost = flyer(source, start, effects);
  const panel = source.ownerDocument.createElement('div');
  panel.className = 'closing-panel';
  const face = source.ownerDocument.createElement('div');
  face.className = 'closing-card';
  const bounds = dialog.getBoundingClientRect();
  face.style.cssText = `left:${bounds.left}px;top:${bounds.top}px;width:${bounds.width}px;height:${bounds.height}px`;
  face.append(...Array.from(dialog.children, (node) => node.cloneNode(true)));
  const cover = face.querySelector<HTMLElement>('.detail-cover');
  if (cover) cover.style.visibility = 'hidden';
  panel.append(face);
  effects.prepend(panel);
  dialog.close();
  try {
    await Promise.all([
      animate(
        ghost,
        [
          { transform: 'translate(0,0) scale(1)' },
          { transform: `translate(${end.left - start.left}px,${end.top - start.top}px) scale(${end.width / start.width})` },
        ],
        550,
      ),
      animate(panel, [{ opacity: 1 }, { opacity: 0 }], 180),
    ]);
  } finally {
    ghost.remove();
    panel.remove();
  }
}
async function confetti(rect: DOMRect, effects: HTMLElement) {
  const nodes = Array.from({ length: 72 }, (_, index) => {
    const piece = effects.ownerDocument.createElement('i');
    piece.className = 'confetti';
    piece.style.cssText = `left:${rect.left + (((index % 12) + 0.5) * rect.width) / 12}px;top:${rect.top + ((Math.floor(index / 12) + 0.5) * rect.height) / 6}px;background:${['#2863c5', '#caa269', '#f0d6b7', '#e1e8d5'][index % 4]}`;
    effects.append(piece);
    const angle = index * 2.39996,
      distance = 90 + (index % 13) * 12,
      dx = Math.cos(angle) * distance,
      dy = Math.sin(angle) * distance;
    return {
      piece,
      finished: animate(
        piece,
        [
          { opacity: 1, transform: 'translate(0,0) rotate(0)' },
          { opacity: 1, transform: `translate(${dx}px,${dy - 70}px) rotate(${index * 31}deg)`, offset: 0.55 },
          { opacity: 0, transform: `translate(${dx * 1.5}px,${dy + 180}px) rotate(${index * 61}deg)` },
        ],
        1050,
        { easing: 'cubic-bezier(.15,.6,.4,1)' },
      ),
    };
  });
  await Promise.all(nodes.map((node) => node.finished));
  nodes.forEach((node) => node.piece.remove());
}
export async function animateShelf(content: HTMLElement, expanded: boolean) {
  if (reduced()) return;
  content.style.overflow = 'clip';
  const height = content.scrollHeight;
  const animation = content.animate(
    [
      { height: expanded ? '0px' : `${height}px`, opacity: expanded ? 0 : 1, transform: expanded ? 'translateY(-12px)' : 'translateY(0)' },
      { height: expanded ? `${height}px` : '0px', opacity: expanded ? 1 : 0, transform: expanded ? 'translateY(0)' : 'translateY(-12px)' },
    ],
    { duration: 420, easing: ease, fill: 'both' },
  );
  await animation.finished.catch(() => {});
  animation.cancel();
  content.style.overflow = '';
}
export interface CheckoutNodes {
  source: HTMLElement;
  button: DOMRect;
  dialog: HTMLDialogElement;
  stage: HTMLElement;
  basket: HTMLElement;
  effects: HTMLElement;
}
export async function checkout({ source, button, dialog, stage, basket, effects }: CheckoutNodes, onReturn: () => void) {
  const rect = source.getBoundingClientRect();
  dialog.close();
  if (reduced()) {
    onReturn();
    return;
  }
  const ghost = flyer(source, rect, effects),
    bounds = basket.getBoundingClientRect(),
    rim = bounds.top + bounds.height * 0.455;
  const x = innerWidth / 2 - rect.width / 2,
    y = Math.max(45, innerHeight * 0.12),
    center = `translate(${x - rect.left}px,${y - rect.top}px) scale(1.08)`;
  const burst = confetti(button, effects),
    mask = source.ownerDocument.createElement('div');
  mask.className = 'book-mask';
  mask.style.clipPath = `polygon(0 0,100% 0,100% ${rim}px,0 ${rim}px)`;
  try {
    await Promise.all([
      animate(stage, [{ opacity: 0 }, { opacity: 1 }], 220),
      animate(
        basket,
        [
          { transform: 'translateY(90px)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        600,
      ),
      animate(ghost, [{ transform: 'translate(0,0) scale(1)' }, { transform: center }], 750),
    ]);
    ghost.before(mask);
    mask.append(ghost);
    await animate(
      ghost,
      [{ transform: center }, { transform: `translate(${x - rect.left}px,${rim - rect.top + 6}px) scale(.72) rotateX(62deg) rotateZ(6deg)` }],
      680,
      { easing: 'cubic-bezier(.5,.04,.9,.5)' },
    );
    await animate(
      basket,
      [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(5px) scale(1.025,.97)', offset: 0.4 }, { transform: 'translateY(0) scale(1)' }],
      240,
    );
    onReturn();
    await Promise.all([
      animate(
        stage,
        [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: 'translateY(65vh)', opacity: 0 },
        ],
        600,
      ),
      burst,
    ]);
  } finally {
    ghost.remove();
    mask.remove();
    stage.hidden = true;
    basket.getAnimations().forEach((animation) => animation.cancel());
    stage.getAnimations().forEach((animation) => animation.cancel());
  }
}
