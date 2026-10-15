import { books, genres } from '../data/books.js';
import { selectBooks } from '../lib/books.js';

const $ = selector => document.querySelector(selector);
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(text, action, id, className) {
  const node = el('button', className, text);
  node.type = 'button';
  node.dataset.action = action;
  if (id) node.dataset.id = id;
  return node;
}
function jacket(book, ordered = false) {
  const cover = el('span','book-jacket');
  cover.style.setProperty('--cover-ratio',book.coverRatio || .67);
  const image = el('img');
  image.src = `assets/covers/${book.id}.jpg`;
  image.alt = '';
  image.width = Math.round((book.coverRatio || .67) * 500);
  image.height = 500;
  image.decoding = 'async';
  const ribbon = el('span','order-ribbon');
  ribbon.hidden = !ordered;
  ribbon.setAttribute('aria-hidden','true');
  ribbon.append(el('span','','Заказана'));
  cover.append(image,ribbon);
  return cover;
}
function card(book, state) {
  const article = el('article', `book-card${book.available ? '' : ' book-unavailable'}`);
  article.dataset.book = book.id;
  const open = button('', 'open', book.id, 'book-open');
  open.setAttribute('aria-label', `Открыть ${book.title}`);
  open.append(jacket(book,state.orders.includes(book.id)));
  const meta = el('div', 'book-meta');
  const saved = state.wishlist.includes(book.id);
  const wish = button(saved ? '♥' : '♡', 'wish', book.id, 'wish-button');
  wish.setAttribute('aria-label', `${saved ? 'Удалить из списка' : 'Хочу прочитать'}: ${book.title}`);
  wish.setAttribute('aria-pressed', String(saved));
  const label = el('div','book-label');
  label.append(el('h3','',book.title),el('p','',book.author.split(',')[0]));
  meta.append(label,wish);
  if (state.view === 'orders') meta.append(button('Убрать', 'remove-order',book.id,'secondary-button'));
  article.append(open,meta);
  return article;
}
function collection(state, selected) {
  const host = $('#shelves');
  const signature = JSON.stringify([state.filters,state.view,state.view === 'wishlist' ? state.wishlist : state.view === 'orders' ? state.orders : [],state.columns]);
  if (host.dataset.signature === signature) return;
  host.dataset.signature = signature;
  const content = document.createDocumentFragment();
  const groups = state.filters.sort === 'shelf'
    ? genres.map(genre => [genre,selected.filter(book => book.genre === genre)])
    : [[{title:'По названию',year:'Сначала новые',rating:'По рейтингу'}[state.filters.sort],selected]];
  for (const [genre,items] of groups) {
    if (!items.length) continue;
    const group = el('details','shelf-group');
    group.open = state.filters.sort !== 'shelf' || state.expanded.includes(genre) || state.view !== 'catalog' || Boolean(state.filters.query || state.filters.genre);
    const summary = el('summary');
    summary.dataset.action = 'expand';
    summary.dataset.genre = genre;
    summary.append(el('h2','',genre));
    group.append(summary);
    const shelves = el('div','shelf-content');
    for (let i = 0; i < items.length; i += state.columns) {
      const row = el('div','shelf-row');
      row.append(...items.slice(i,i + state.columns).map(book => card(book,state)));
      const board = el('div','shelf-board');
      const image = el('img'); image.src = 'assets/shelf.webp'; image.alt = '';
      board.append(image); row.append(board); shelves.append(row);
    }
    group.append(shelves);
    content.append(group);
  }
  if (!selected.length) {
    const empty = el('div','empty-state');
    empty.append(el('h3','',state.view === 'wishlist' ? 'Список пуст' : state.view === 'orders' ? 'Корзина пуста' : 'Ничего не найдено'),
      el('p','', 'Измените поиск или вернитесь в каталог.'),
      button('Вернуться к полкам','reset',null,'primary-button'));
    content.append(empty);
  }
  host.replaceChildren(content);
}
function detail(state) {
  const dialog = $('#book-dialog');
  const book = books.find(item => item.id === state.selected);
  if (state.phase === 'ordering') return;
  if (!book) { if (dialog.open) dialog.close(); return; }
  const cover = $('#detail-cover');
  if (dialog.dataset.book !== String(book.id)) {
    cover.replaceChildren(jacket(book,state.orders.includes(book.id)));
    dialog.dataset.book = book.id;
  }
  cover.querySelector('.order-ribbon').hidden = !state.orders.includes(book.id);
  const copy = $('#detail-copy');
  const title = el('h2','',book.title);
  title.id = 'detail-title';
  const facts = el('div','book-facts');
  for (const [label,value] of [['Год',book.year],['Рейтинг',`${book.rating} из 5`]]) {
    const fact = el('span'); fact.append(el('small','',label),el('span','',String(value))); facts.append(fact);
  }
  const ordered = state.orders.includes(book.id);
  const order = button(ordered ? 'Уже в корзине' : book.available ? 'Заказать книгу' : 'Сейчас нет на полке','order',book.id,'primary-button');
  order.disabled = ordered || !book.available;
  order.id = 'order-button';
  const wish = button(state.wishlist.includes(book.id) ? '♥ В моём списке' : '♡ Хочу прочитать','wish',book.id,'secondary-button');
  wish.setAttribute('aria-pressed',String(state.wishlist.includes(book.id)));
  copy.replaceChildren(el('p','eyebrow',book.genre), title, el('p','detail-author',book.author),
    el('p','detail-description',book.description),facts,order,wish);
  if (!dialog.open) dialog.showModal();
}
export function render(state) {
  const selected = selectBooks(books,state.filters,state.view,state.wishlist,state.orders);
  collection(state,selected);
  document.querySelectorAll('.book-card').forEach(node => {
    const id = Number(node.dataset.book);
    const ordered = state.orders.includes(id);
    node.classList.toggle('is-selected',id === state.selected);
    node.querySelector('.order-ribbon').hidden = !ordered;
    const wish = node.querySelector('.wish-button');
    const saved = state.wishlist.includes(id);
    wish.textContent = saved ? '♥' : '♡';
    wish.setAttribute('aria-pressed',String(saved));
    const title = node.querySelector('h3').textContent;
    wish.setAttribute('aria-label',`${saved ? 'Удалить из списка' : 'Хочу прочитать'}: ${title}`);
    node.querySelector('.book-open').setAttribute('aria-label',`Открыть ${title}${ordered ? ', заказана' : ''}`);
  });
  const form = $('#filters');
  const genre = form.elements.genre;
  if (genre.options.length === 1) {
    for (const name of genres) { const option = el('option','',name); option.value = name; genre.append(option); }
  }
  for (const [name,value] of Object.entries(state.filters)) {
    if (name === 'available') form.elements[name].checked = value;
    else if (form.elements[name].value !== value) form.elements[name].value = value;
  }
  $('#wish-count').textContent = state.wishlist.length;
  $('#order-count').textContent = state.orders.length;
  $('#collection-title').textContent = {catalog:'Каталог',wishlist:'Мой список',orders:'Корзина'}[state.view];
  $('#result-count').textContent = `${selected.length} книг`;
  document.querySelectorAll('[data-view]').forEach(node => {
    if (node.dataset.view === state.view) node.setAttribute('aria-current','page');
    else node.removeAttribute('aria-current');
  });
  $('#availability-filter').hidden = !state.filters.query.trim();
  $('#notice').textContent = state.notice;
  $('#checkout-stage').hidden = state.phase !== 'ordering';
  document.body.classList.toggle('is-checkout',state.phase === 'ordering');
  document.querySelector('main').inert = Boolean(state.selected || state.phase !== 'idle');
  document.querySelector('.site-header').inert = Boolean(state.selected || state.phase !== 'idle');
  detail(state);
}
