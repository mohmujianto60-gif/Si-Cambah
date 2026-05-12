// Small helper for "fetch on mount + refresh-on-event" data loading. Keeps
// pages free of repetitive useEffect + cancellation boilerplate and works
// around the react-hooks/set-state-in-effect rule by only calling setState
// after an await.

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DATA_CHANGE_EVENT } from './hibahService';

export interface AsyncDataState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  initial: T,
  options: { errorPrefix?: string; listenToChanges?: boolean } = {},
): AsyncDataState<T> {
  const { errorPrefix = 'Gagal memuat data', listenToChanges = true } = options;
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetcher();
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const msg = (err as Error).message;
        setError(msg);
        toast.error(`${errorPrefix}: ${msg}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, fetcher]);

  useEffect(() => {
    if (!listenToChanges) return;
    const onChange = () => refresh();
    window.addEventListener(DATA_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, onChange);
  }, [listenToChanges, refresh]);

  return { data, loading, error, refresh };
}
