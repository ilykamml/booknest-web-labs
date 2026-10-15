import { useEffect, useState } from 'react';
import type { Resource } from '../types';
export function useResource<T>(loader: (signal: AbortSignal) => Promise<T>): [Resource<T>, () => void] {
  const [resource, setResource] = useState<Resource<T>>({ status: 'loading' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setResource({ status: 'loading' });
    (async () => {
      let result: Resource<T> | undefined;
      try {
        result = { status: 'success', data: await loader(controller.signal) };
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') result = { status: 'error', error };
      } finally {
        if (active && result) setResource(result);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [loader, revision]);
  return [resource, () => setRevision((value) => value + 1)];
}
export function useDebouncedValue(value: string, delay = 350): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
