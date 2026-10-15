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
function jacket(book) {
  const cover = el('div', 'book-jacket');
  cover.style.setProperty('--book-color', book.color);
  const longest = Math.max(...book.title.split(/\s+/).map(word => word.length));
  cover.style.setProperty('--jacket-size', `${longest > 12 || book.title.length > 50 ? 14 : longest > 9 || book.title.length > 24 ? 17 : 21}px`);
  cover.setAttribute('lang', 'en');
  cover.append(el('span','jacket-category',book.genre), el('span','jacket-title',book.title),
    el('span','jacket-author',book.author.split(',').slice(0,2).join(', ')), el('span','jacket-year',String(book.year)));
  return cover;
}
function card(book, state) {
  const article = el('article', `book-card${book.available ? '' : ' book-unavailable'}`);
  article.dataset.book = book.id;
  const open = button('', 'open', book.id, 'book-open');
  open.setAttribute('aria-label', `Открыть ${book.title}`);
  open.append(jacket(book));
  const meta = el('div', 'book-meta');
  const saved = state.wishlist.includes(book.id);
  const wish = button(saved ? '♥' : '♡', 'wish', book.id, 'wish-button');
  wish.setAttribute('aria-label', `${saved ? 'Удалить из списка' : 'Хочу прочитать'}: ${book.title}`);
  wish.setAttribute('aria-pressed', String(saved));
  meta.append(el('p','',book.author.split(',')[0]),wish);
  if (state.view === 'orders') meta.append(button('Убрать', 'remove-order',book.id,'secondary-button'));
  article.append(open,meta);
  return article;
}
function collection(state, selected) {
  const host = $('#shelves');
  const signature = JSON.stringify([state.filters,state.view,state.wishlist,state.orders,state.columns,state.expanded]);
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
    const summary = el('summary','',genre);
    summary.dataset.action = 'expand';
    summary.dataset.genre = genre;
    summary.append(el('small','',`${String(items.length).padStart(2,'0')} книг`));
    group.append(summary);
    for (let i = 0; i < items.length; i += state.columns) {
      const row = el('div','shelf-row');
      row.append(...items.slice(i,i + state.columns).map(book => card(book,state)));
      group.append(row);
    }
    content.append(group);
  }
  if (!selected.length) {
    const empty = el('div','empty-state');
    empty.append(el('h3','',state.view === 'wishlist' ? 'Здесь будет ваше любопытство.' : state.view === 'orders' ? 'Корзина ждёт свою первую книгу.' : 'На этой полке пока тихо.'),
      el('p','', 'Попробуйте другое название, автора или сбросьте фильтры. Книги можно добавить с любой полки.'),
      button('Вернуться к полкам','reset',null,'primary-button'));
    content.append(empty);
  }
  host.replaceChildren(content);
}
function detail(state) {
  const dialog = $('#book-dialog');
  const book = books.find(item => item.id === state.selected);
  if (!book) { if (dialog.open) dialog.close(); return; }
  const cover = $('#detail-cover');
  if (dialog.dataset.book !== String(book.id)) {
    cover.replaceChildren(jacket(book));
    dialog.dataset.book = book.id;
  }
  const copy = $('#detail-copy');
  const title = el('h2','',book.title);
  title.id = 'detail-title';
  const facts = el('div','book-facts');
  for (const [label,value] of [['Издание',book.year],['Рейтинг',`${book.rating} из 5`],['Формат','Печатная книга']]) {
    const fact = el('span'); fact.append(el('small','',label),el('span','',String(value))); facts.append(fact);
  }
  const ordered = state.orders.includes(book.id);
  const order = button(ordered ? 'Уже в корзине' : book.available ? 'Заказать книгу' : 'Сейчас нет на полке','order',book.id,'primary-button');
  order.disabled = ordered || !book.available || state.phase !== 'idle';
  order.id = 'order-button';
  const wish = button(state.wishlist.includes(book.id) ? '♥ В моём списке' : '♡ Хочу прочитать','wish',book.id,'secondary-button');
  wish.setAttribute('aria-pressed',String(state.wishlist.includes(book.id)));
  copy.replaceChildren(el('p','eyebrow',book.genre), title, el('p','detail-author',book.author),
    el('p','detail-description',book.description),facts,order,wish,
    el('p','demo-note','Учебная заявка сохранится в этом браузере. Библиотеке она не отправляется.'));
  if (!dialog.open) dialog.showModal();
}
export function render(state) {
  const selected = selectBooks(books,state.filters,state.view,state.wishlist,state.orders);
  collection(state,selected);
  document.querySelectorAll('.book-card').forEach(node => node.classList.toggle('is-selected',Number(node.dataset.book) === state.selected));
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
  $('#collection-title').textContent = {catalog:'На наших полках',wishlist:'Ваш список для чтения',orders:'Ваша корзина'}[state.view];
  $('#result-count').textContent = `${selected.length} из ${books.length} книг`;
  document.querySelectorAll('[data-view]').forEach(node => {
    if (node.dataset.view === state.view) node.setAttribute('aria-current','page');
    else node.removeAttribute('aria-current');
  });
  $('#notice').textContent = state.notice;
  $('#checkout-stage').hidden = state.phase !== 'ordering';
  document.body.classList.toggle('is-checkout',state.phase === 'ordering');
  detail(state);
}
