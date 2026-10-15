const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = 'cubic-bezier(.22,.85,.22,1)';
const animate = (node, frames, duration, options = {}) => node.animate(frames,{duration,easing:ease,fill:'both',...options}).finished.catch(() => {});
function flyer(source, rect) {
  const node = document.createElement('div');
  node.className = 'flying-book';
  node.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
  node.append(source.cloneNode(true));
  document.querySelector('#effects').append(node);
  return node;
}
export async function openBook(source,target,start) {
  if (reduced() || !source || !target) return;
  const end = target.getBoundingClientRect();
  const ghost = flyer(source,start);
  target.style.visibility = 'hidden';
  const dialog = document.querySelector('#book-dialog');
  dialog.append(ghost);
  await Promise.all([
    animate(ghost,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${end.left-start.left}px,${end.top-start.top}px) scale(${end.width/start.width})`}],650),
    animate(document.querySelector('#detail-copy'),[{opacity:0,transform:'translateX(18px)'},{opacity:1,transform:'translateX(0)'}],420,{delay:150}),
  ]);
  target.style.visibility = '';
  ghost.remove();
}
export async function closeBook(source,target) {
  const dialog = document.querySelector('#book-dialog');
  if (reduced() || !source || !target) { dialog.close(); return; }
  const start = source.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const ghost = flyer(source,start);
  const panel = document.createElement('div'); panel.className = 'closing-panel';
  const face = document.createElement('div'); face.className = 'closing-card';
  const bounds = dialog.getBoundingClientRect();
  face.style.cssText = `left:${bounds.left}px;top:${bounds.top}px;width:${bounds.width}px;height:${bounds.height}px`;
  face.append(...Array.from(dialog.children,node => node.cloneNode(true)));
  face.querySelector('#detail-cover').style.visibility = 'hidden';
  panel.append(face); document.querySelector('#effects').prepend(panel);
  dialog.close();
  await Promise.all([
    animate(ghost,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${end.left-start.left}px,${end.top-start.top}px) scale(${end.width/start.width})`}],550),
    animate(panel,[{opacity:1},{opacity:0}],180),
  ]);
  ghost.remove(); panel.remove();
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
export async function toggleShelf(group,expanded) {
  const content = group.querySelector('.shelf-content');
  const start = group.open ? content.getBoundingClientRect().height : 0;
  content.getAnimations().forEach(animation => animation.cancel());
  group.dataset.expanded = String(expanded);
  group.open = true;
  if (!reduced()) {
    content.style.overflow = 'clip';
    const animation = content.animate([
      {height:`${start}px`,opacity:start ? 1 : 0,transform:start ? 'translateY(0)' : 'translateY(-12px)'},
      {height:expanded ? `${content.scrollHeight}px` : '0px',opacity:expanded ? 1 : 0,transform:expanded ? 'translateY(0)' : 'translateY(-12px)'},
    ],{duration:420,easing:ease,fill:'both'});
    try { await animation.finished; } catch { return; }
    if (group.dataset.expanded !== String(expanded)) return;
    group.open = expanded;
    animation.cancel();
    content.style.overflow = '';
  } else group.open = expanded;
}
export async function checkout(source,buttonRect,onReturn) {
  if (reduced()) { onReturn(); return; }
  const rect = source.getBoundingClientRect();
  const ghost = flyer(source,rect);
  document.querySelector('#book-dialog').close();
  const stage = document.querySelector('#checkout-stage');
  const basket = stage.querySelector('.basket');
  const bounds = basket.getBoundingClientRect();
  const rim = bounds.top + bounds.height * .455;
  const centerX = innerWidth / 2 - rect.width / 2;
  const centerY = Math.max(45,innerHeight * .12);
  const center = `translate(${centerX-rect.left}px,${centerY-rect.top}px) scale(1.08)`;
  const burst = confetti(buttonRect,'#2863c5');
  const mask = document.createElement('div'); mask.className = 'book-mask';
  mask.style.clipPath = `polygon(0 0,100% 0,100% ${rim}px,0 ${rim}px)`;
  try {
    await Promise.all([
      animate(stage,[{opacity:0},{opacity:1}],220),
      animate(basket,[{transform:'translateY(90px)',opacity:0},{transform:'translateY(0)',opacity:1}],600),
      animate(ghost,[{transform:'translate(0,0) scale(1)'},{transform:center}],750),
    ]);
    ghost.before(mask); mask.append(ghost);
    // Книга скрывается за краем корзины, а не уходит сквозь её дно.
    await animate(ghost,[{transform:center},{transform:`translate(${centerX-rect.left}px,${rim-rect.top+6}px) scale(.72) rotateX(62deg) rotateZ(6deg)`}],680,{easing:'cubic-bezier(.5,.04,.9,.5)'});
    await animate(basket,[{transform:'translateY(0) scale(1)'},{transform:'translateY(5px) scale(1.025,.97)',offset:.4},{transform:'translateY(0) scale(1)'}],240);
    // Возвращаем книгу, пока непрозрачная сцена закрывает каталог.
    onReturn();
    await Promise.all([animate(stage,[{transform:'translateY(0)',opacity:1},{transform:'translateY(65vh)',opacity:0}],600),burst]);
  } finally {
    ghost.remove(); mask.remove();
    stage.hidden = true;
    basket.getAnimations().forEach(animation => animation.cancel());
    stage.getAnimations().forEach(animation => animation.cancel());
  }
}
