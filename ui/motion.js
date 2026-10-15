const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = 'cubic-bezier(.22,.85,.22,1)';
const animate = (node, frames, duration, options = {}) => node.animate(frames,{duration,easing:ease,fill:'both',...options}).finished.catch(() => {});
function flyer(source, rect) {
  const node = document.createElement('div');
  node.className = 'flying-book';
  node.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
  const copy = source.cloneNode(true);
  for (const [original,clone] of [[source,copy],...Array.from(source.children,(child,i) => [child,copy.children[i]])]) {
    const style = getComputedStyle(original);
    clone.style.fontSize = style.fontSize;
    clone.style.padding = style.padding;
  }
  node.style.transformOrigin = 'top left';
  node.append(copy);
  document.querySelector('#effects').append(node);
  return node;
}
export async function openBook(source, target, start) {
  if (reduced() || !source || !target) return;
  const end = target.getBoundingClientRect();
  const ghost = flyer(source,start);
  target.style.visibility = 'hidden';
  const dialog = document.querySelector('#book-dialog');
  // Верхний слой dialog всегда выше обычного DOM; перелёт временно живёт внутри него.
  dialog.append(ghost);
  const copy = document.querySelector('#detail-copy');
  await Promise.all([
    animate(ghost,[{transform:'translate(0,0) rotate(-2deg)'},{transform:`translate(${end.left-start.left}px,${end.top-start.top}px) scale(${end.width/start.width}) rotate(0)`}],760),
    animate(copy,[{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],620,{delay:220}),
  ]);
  target.style.visibility = '';
  ghost.remove();
}
export async function closeBook(source, target) {
  if (reduced() || !source || !target) return;
  const start = source.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const ghost = flyer(source,start);
  document.querySelector('#book-dialog').append(ghost);
  source.style.visibility = 'hidden';
  await animate(ghost,[{transform:'translate(0,0)'},{transform:`translate(${end.left-start.left}px,${end.top-start.top}px) scale(${end.width/start.width})`,opacity:.15}],450);
  source.style.visibility = '';
  ghost.remove();
}
async function confetti(rect, color) {
  const layer = document.querySelector('#effects');
  const nodes = Array.from({length:72},(_,i) => {
    const piece = document.createElement('i');
    piece.className = 'confetti';
    const x = rect.left + (i % 12 + .5) * rect.width / 12;
    const y = rect.top + (Math.floor(i / 12) + .5) * rect.height / 6;
    piece.style.cssText = `left:${x}px;top:${y}px;background:${[color,'#caa269','#f0d6b7','#e1e8d5'][i % 4]}`;
    layer.append(piece);
    const angle = i * 2.39996;
    const distance = 90 + (i % 13) * 12;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    return {piece,finished:animate(piece,[{opacity:1,transform:'translate(0,0) rotate(0)'},{opacity:1,transform:`translate(${dx}px,${dy-70}px) rotate(${i*31}deg)`,offset:.55},{opacity:0,transform:`translate(${dx*1.5}px,${dy+180}px) rotate(${i*61}deg)`}],1050,{easing:'cubic-bezier(.15,.6,.4,1)'})};
  });
  await Promise.all(nodes.map(node => node.finished));
  nodes.forEach(node => node.piece.remove());
}
export async function checkout(source, buttonRect) {
  if (reduced()) return;
  const rect = source.getBoundingClientRect();
  const ghost = flyer(source,rect);
  document.querySelector('#book-dialog').close();
  const stage = document.querySelector('#checkout-stage');
  const front = stage.querySelector('.basket-front');
  // Выносим переднюю стенку выше летящей книги: книга действительно скрывается за плетением.
  document.body.append(front);
  front.style.zIndex = '101';
  const basket = front.getBoundingClientRect();
  const centerX = innerWidth / 2 - rect.width / 2;
  const centerY = Math.max(55,innerHeight * .14);
  const burst = confetti(buttonRect,getComputedStyle(document.documentElement).getPropertyValue('--accent'));
  try {
    await Promise.all([
      animate(stage,[{opacity:0},{opacity:1}],360),
      animate(front,[{transform:'translateY(130px)',opacity:0},{transform:'translateY(0)',opacity:1}],700),
      animate(ghost,[{transform:'translate(0,0) rotate(0)'},{transform:`translate(${centerX-rect.left}px,${centerY-rect.top}px) scale(1.12) rotate(-7deg)`}],850),
    ]);
    const dropX = innerWidth / 2 - rect.width / 2 - rect.left;
    const dropY = basket.top + basket.height * .52 - rect.top;
    await animate(ghost,[{transform:`translate(${centerX-rect.left}px,${centerY-rect.top}px) scale(1.12) rotate(-7deg)`,opacity:1},{transform:`translate(${dropX}px,${dropY}px) scale(.67) rotate(13deg)`,opacity:1,offset:.86},{transform:`translate(${dropX}px,${dropY+35}px) scale(.62) rotate(14deg)`,opacity:0}],720,{easing:'cubic-bezier(.55,.02,.84,.4)'});
    await Promise.all([animate(front,[{transform:'translateY(0)'},{transform:'translateY(110vh)'}],720),animate(stage,[{opacity:1},{opacity:0}],720),burst]);
  } finally {
    ghost.remove();
    stage.append(front);
    front.style.zIndex = '';
    front.getAnimations().forEach(animation => animation.cancel());
    stage.getAnimations().forEach(animation => animation.cancel());
  }
}
