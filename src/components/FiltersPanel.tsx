import type { Filters, Sort, Source } from '../types';
import type { Ref } from 'react';
import { genres } from '../lib/books';
import { Button } from './Controls';
interface FiltersPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  searchRef: Ref<HTMLInputElement>;
  catalog: boolean;
}
export function FiltersPanel({ filters, onChange, onReset, searchRef, catalog }: FiltersPanelProps) {
  return (
    <form
      className="filter-bar"
      role="search"
      aria-label="Поиск и фильтры книг"
      onSubmit={(event) => event.preventDefault()}
      onReset={(event) => {
        event.preventDefault();
        onReset();
      }}
    >
      <label className="search-field">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          ref={searchRef}
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          name="query"
          type="search"
          placeholder="Название, автор или тема"
          aria-label="Название или автор"
          maxLength={160}
          autoComplete="off"
        />
      </label>
      {catalog && (
        <label className="select-field">
          <span>Где искать</span>
          <select
            aria-label="Где искать"
            value={filters.source}
            onChange={(event) => onChange({ ...filters, source: event.target.value as Source, available: false })}
          >
            <option value="local">На полках</option>
            <option value="openlibrary">Open Library</option>
          </select>
        </label>
      )}
      <label className="select-field">
        <span>Направление</span>
        <select aria-label="Направление" value={filters.genre} onChange={(event) => onChange({ ...filters, genre: event.target.value })}>
          <option value="">Все направления</option>
          {genres.map((genre) => (
            <option key={genre}>{genre}</option>
          ))}
        </select>
      </label>
      <label className="select-field">
        <span>Порядок на полке</span>
        <select aria-label="Сортировка" value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value as Sort })}>
          <option value="shelf">Выбор библиотеки</option>
          <option value="title">По названию А–Я</option>
          <option value="year">Сначала новые</option>
          <option value="rating">По рейтингу</option>
        </select>
      </label>
      {filters.query.trim() && (
        <label className="check-field">
          <input type="checkbox" checked={filters.available} onChange={(event) => onChange({ ...filters, available: event.target.checked })} />
          Только доступные
        </label>
      )}
      <Button className="reset-button" type="reset">
        Сбросить
      </Button>
    </form>
  );
}
