"use client";
/**
 * Pagination state hook with URL search param synchronization.
 *
 * @example
 * const { page, pageSize, offset, setPage, setPageSize, totalPages } = usePagination({ total: 200 });
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface UsePaginationOptions {
  /** Total number of records (from API). */
  total?: number;
  /** Default page size. */
  defaultPageSize?: number;
  /** Sync pagination state to URL search params. */
  syncUrl?: boolean;
}

export interface UsePaginationResult {
  page: number;
  pageSize: number;
  offset: number;
  totalPages: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  /** API params to pass to `useList`. */
  apiParams: { page: number; pageSize: number };
  hasNext: boolean;
  hasPrev: boolean;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationResult {
  const { total = 0, defaultPageSize = 25, syncUrl = true } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialPage = syncUrl ? parseInt(searchParams.get("page") || "1", 10) : 1;
  const initialSize = syncUrl ? parseInt(searchParams.get("pageSize") || String(defaultPageSize), 10) : defaultPageSize;

  const [page, setPageState] = useState(Math.max(1, initialPage));
  const [pageSize, setPageSizeState] = useState(Math.max(1, initialSize));

  const totalPages = useMemo(
    () => (total > 0 ? Math.ceil(total / pageSize) : 1),
    [total, pageSize],
  );

  const updateUrl = useCallback(
    (p: number, s: number) => {
      if (!syncUrl) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      params.set("pageSize", String(s));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [syncUrl, searchParams, router, pathname],
  );

  const setPage = useCallback(
    (p: number) => {
      const clamped = Math.max(1, Math.min(p, totalPages));
      setPageState(clamped);
      updateUrl(clamped, pageSize);
    },
    [totalPages, pageSize, updateUrl],
  );

  const setPageSize = useCallback(
    (s: number) => {
      setPageSizeState(s);
      setPageState(1); // Reset to page 1 when changing size
      updateUrl(1, s);
    },
    [updateUrl],
  );

  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    offset,
    totalPages,
    setPage,
    setPageSize,
    apiParams: { page, pageSize },
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
