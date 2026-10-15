import { books, genres } from './data/books.js';
import { defaults, restore, toggleId } from './lib/books.js';
import { render } from './ui/render.js';
import { openBook, closeBook, checkout, toggleShelf } from './ui/motion.js';

const storageKey = 'booknest-v3';
function readSaved() {
  try { return restore(JSON.parse(localStorage.getItem(storageKey)),books.map(book => book.id),genres); }
  catch { return restore(null,[],genres); }
}
const state = {
  ...readSaved(), view: 'catalog', selected: null, phase: 'idle', notice: '', storageAvailable: true,
  closeRequested: false, expanded: [...genres], columns: innerWidth <= 650 ? 2 : 4,
};
let noticeTimer;
function save() {
  try { localStorage.setItem(storageKey,JSON.stringify({filters:state.filters,wishlist:state.wishlist,orders:state.orders})); state.storageAvailable = true; }
  catch { state.storageAvailable = false; state.notice = 'Хранилище недоступно. Выбор сохранён только до закрытия страницы.'; }
}
function update() { save(); render(state); }
function notify(message) {
  clearTimeout(noticeTimer);
  state.notice = message;
  render(state);
  noticeTimer = setTimeout(() => { state.notice = ''; render(state); },4200);
}
function reset() {
  state.filters = {...defaults}; state.view = 'catalog'; update();
}
async function close() {
  if (state.phase === 'opening') { state.closeRequested = true; return; }
  if (state.phase !== 'idle') return;
  state.phase = 'closing';
  const id = state.selected;
  await closeBook(document.querySelector('#detail-cover .book-jacket'),document.querySelector(`[data-book="${id}"] .book-jacket`));
  state.selected = null; state.phase = 'idle'; render(state);
  document.querySelector(`[data-book="${id}"] .book-open`)?.focus({preventScroll:true});
}
async function open(id) {
  const source = document.querySelector(`[data-book="${id}"] .book-jacket`);
  // Координаты фиксируем до showModal: блокировка прокрутки не сдвинет начальную точку.
  const start = source?.getBoundingClientRect();
  state.selected = id; state.phase = 'opening'; render(state);
  await openBook(source,document.querySelector('#detail-cover .book-jacket'),start);
  state.phase = 'idle'; render(state);
  if (state.closeRequested) { state.closeRequested = false; await close(); return; }
  document.querySelector('[data-action="close"]').focus();
}
async function order(id) {
  const book = books.find(item => item.id === id);
  if (!book?.available || state.orders.includes(id)) return;
  const rect = document.querySelector('#order-button').getBoundingClientRect();
  state.orders = [...state.orders,id]; state.phase = 'ordering'; update();
  try {
    await checkout(document.querySelector('#detail-cover .book-jacket'),rect,() => {
      state.selected = null;
      state.view = 'catalog';
      render(state);
    });
  }
  finally {
    state.phase = 'idle'; state.selected = null; state.view = 'catalog'; render(state);
    document.querySelector(`[data-book="${id}"] .book-open`)?.focus({preventScroll:true});
    notify(state.storageAvailable ? 'Добавлено в корзину' : 'Хранилище недоступно');
  }
}
document.addEventListener('click',async event => {
  const target = event.target.closest('[data-action],[data-view]');
  if (!target) return;
  if (state.phase !== 'idle') {
    event.preventDefault();
    if (target.dataset.action === 'close' && state.phase === 'opening') state.closeRequested = true;
    return;
  }
  if (target.dataset.view) {
    state.view = target.dataset.view; state.filters = {...defaults}; update();
    document.querySelector('.collection').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    return;
  }
  const id = Number(target.dataset.id);
  switch (target.dataset.action) {
    case 'open': await open(id); break;
    case 'close': await close(); break;
    case 'wish':
      state.wishlist = toggleId(state.wishlist,id); update();
      document.querySelector(state.selected ? '#detail-copy [data-action="wish"]' : `[data-book="${id}"] .wish-button`)?.focus({preventScroll:true});
      break;
    case 'order': await order(id); break;
    case 'remove-order': state.orders = state.orders.filter(item => item !== id); update(); break;
    case 'reset': reset(); break;
    case 'expand':
      event.preventDefault();
      {
        const genre = target.dataset.genre;
        const group = target.closest('.shelf-group');
        const expanded = group.dataset.expanded ? group.dataset.expanded !== 'true' : !group.open;
        state.expanded = expanded ? [...state.expanded,genre] : state.expanded.filter(item => item !== genre);
        await toggleShelf(group,expanded);
      }
      break;
  }
});
const form = document.querySelector('#filters');
form.addEventListener('submit',event => event.preventDefault());
form.addEventListener('input',event => {
  if (state.phase !== 'idle') return;
  const input = event.target;
  state.filters = {...state.filters,[input.name]:input.type === 'checkbox' ? input.checked : input.value};
  update();
});
form.addEventListener('reset',event => { event.preventDefault(); reset(); });
document.querySelector('#book-dialog').addEventListener('cancel',event => { event.preventDefault(); close(); });
document.addEventListener('keydown',event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !state.selected) {
    event.preventDefault(); form.elements.query.focus();
  }
});
window.addEventListener('resize',() => {
  const columns = innerWidth <= 650 ? 2 : 4;
  if (columns !== state.columns && state.phase === 'idle') { state.columns = columns; render(state); }
});
render(state);
