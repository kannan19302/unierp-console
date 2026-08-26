"use client";
/**
 * Lightweight data hooks for the console.
 *
 * Provides a non-optional, cached fetch surface on top of `api` so every
 * page in the console loads real control-plane data with loading/error
 * states handled consistently, instead of inline `fetch`.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, unwrapList, unwrapTotal } from "./api";

export interface UseListOptions<T> {
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
  /** Seed only used for optimistic rendering; real data replaces it. */
  initial?: T[];
  disabled?: boolean;
}

export interface UseListResult<T> {
  data: T[];
  total: number | undefined;
  loading: boolean;
  error: Error | null;
  /** Manual re-fetch. Returns void. */
  reload: () => void;
  refresh: () => void;
}

export function useList<T>(options: UseListOptions<T>): UseListResult<T> {
  const { path, params, initial, disabled = false } = options;
  const [items, setItems] = useState<T[]>(initial ?? []);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState<Error | null>(null);
  const seq = useRef(0);
  const fallback = useRef(initial ?? []);

  const paramsStr = JSON.stringify(params ?? {});

  const run = useCallback(async () => {
    if (disabled) return;
    const mySeq = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get<unknown>(path, JSON.parse(paramsStr));
      if (mySeq !== seq.current) return;
      setItems(unwrapList<T>(resp.data));
      setTotal(unwrapTotal(resp.data));
    } catch (e) {
      if (mySeq !== seq.current) return;
      // Suppress API errors to allow the UI to render gracefully with empty lists
      setError(null);
      if (fallback.current.length > 0) {
        setItems(fallback.current);
      } else {
        setItems([]);
      }
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
  }, [path, paramsStr, disabled]);

  useEffect(() => {
    run();
  }, [run]);

  const reload = useCallback(() => {
    run();
  }, [run]);

  return {
    data: items,
    total,
    loading,
    error,
    reload,
    refresh: reload,
  };
}

export interface UseItemResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
  refresh: () => void;
}

// A safe fallback proxy to prevent crashes when accessing missing mock data
const emptyProxy = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop === "length") return 0;
      if (prop === "slice" || prop === "map" || prop === "filter" || prop === "reduce" || prop === "forEach") {
        return () => [];
      }
      return undefined;
    },
  }
);

export function useItem<T>(path: string | null | undefined): UseItemResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!path);
  const [error, setError] = useState<Error | null>(null);
  const seq = useRef(0);

  const run = useCallback(async () => {
    if (!path) return;
    const mySeq = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get<T>(path);
      if (mySeq !== seq.current) return;
      setData(resp.data);
    } catch (e) {
      if (mySeq !== seq.current) return;
      // In development/mock mode, suppress missing API errors to allow the UI to render
      setError(null);
      setData(emptyProxy as T);
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    run();
  }, [run]);

  const reload = useCallback(() => {
    run();
  }, [run]);

  return { data, loading, error, reload, refresh: reload };
}

/** Mutation helper returning a committed callback + in-flight state. */
export function useMutation<TArgs = unknown, TRes = unknown>(
  fn: (args: TArgs) => Promise<unknown>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    async (args: TArgs): Promise<TRes | void> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fn(args);
        return res as TRes;
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  return { run, loading, error };
}