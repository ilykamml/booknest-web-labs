import test from 'node:test';
import assert from 'node:assert/strict';
import { books, genres } from '../data/books.js';
import { defaults, selectBooks, restore, toggleId } from '../lib/books.js';

test('40 уникальных настоящих книг и пять направлений',() => {
  assert.equal(books.length,40); assert.equal(new Set(books.map(book => book.id)).size,40); assert.equal(genres.length,5);
});
test('поиск, жанр и наличие сочетаются, сортировка не меняет исходный массив',() => {
  const before = JSON.stringify(books);
  const result = selectBooks(books,{...defaults,query:'HAWKING',genre:'Наука',available:true,sort:'year'});
  assert.deepEqual(result.map(book => book.title),['A Brief History of Time']);
  assert.equal(JSON.stringify(books),before);
  assert.equal(selectBooks(books,{...defaults,query:'Хокинг'})[0].id,18);
  for (const sort of ['title','year','rating']) { selectBooks(books,{...defaults,sort}); assert.equal(JSON.stringify(books),before); }
});
test('недоступные книги появляются только в поиске, переключатель наличия работает',() => {
  const unavailable = books.find(book => !book.available);
  assert.ok(selectBooks(books,defaults).every(book => book.available));
  assert.ok(selectBooks(books,{...defaults,query:unavailable.title}).some(book => book.id === unavailable.id));
  assert.equal(selectBooks(books,{...defaults,query:unavailable.title,available:true}).length,0);
});
test('восстановление отбрасывает испорченные фильтры и неизвестные id',() => {
  const restored = restore({filters:{query:42,genre:'???',sort:'bad'},wishlist:[1,1,999,'2'],orders:null},books.map(book => book.id),genres);
  assert.deepEqual(restored.filters,defaults); assert.deepEqual(restored.wishlist,[1]); assert.deepEqual(restored.orders,[]);
  assert.deepEqual(restore(null,[],genres).filters,defaults);
});
test('список желаемого иммутабелен, выборки списка и корзины независимы',() => {
  const wishlist = [1,2]; assert.deepEqual(toggleId(wishlist,1),[2]); assert.deepEqual(wishlist,[1,2]);
  assert.deepEqual(selectBooks(books,defaults,'wishlist',[3]).map(book => book.id),[3]);
  assert.deepEqual(selectBooks(books,defaults,'orders',[],[4]).map(book => book.id),[4]);
});
