"use client";
/**
 * Filter and sort state management with URL search param synchronization.
 *
 * @example
 * const { filters, sortColumn, sortDirection, setFilter, clearFilters, toggleSort } = useFilterSort();
 */
import { useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface UseFilterSortOptions {
  /** Default sort column. */
  defaultSort?: string;
  /** Default sort direction. */
  defaultDirection?: "asc" | "desc";
  /** Sync to URL search params. */
  syncUrl?: boolean;
}

export interface UseFilterSortResult {
  filters: Record<string, string>;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  setFilter: (key: string, value: string) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  toggleSort: (column: string) => void;
  setSort: (column: string, direction: "asc" | "desc") => void;
  /** Combined params for API requests. */
  apiParams: Record<string, string>;
  /** Active filter count. */
  activeFilterCount: number;
}

// Keys used internally for sort — these are not treated as filters.
const RESERVED_KEYS = new Set(["page", "pageSize", "sort", "dir"]);

export function useFilterSort(options: UseFilterSortOptions = {}): UseFilterSortResult {
  const { defaultSort = "", defaultDirection = "asc", syncUrl = true } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize from URL
  const initFilters = useMemo(() => {
    const f: Record<string, string> = {};
    if (syncUrl) {
      searchParams.forEach((value, key) => {
        if (!RESERVED_KEYS.has(key) && value) f[key] = value;
      });
    }
    return f;
  }, [searchParams, syncUrl]);

  const [filters, setFilters] = useState<Record<string, string>>(initFilters);
  const [sortColumn, setSortColumn] = useState(
    syncUrl ? (searchParams.get("sort") || defaultSort) : defaultSort,
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    syncUrl ? ((searchParams.get("dir") as "asc" | "desc") || defaultDirection) : defaultDirection,
  );

  const updateUrl = useCallback(
    (newFilters: Record<string, string>, sort: string, dir: string) => {
      if (!syncUrl) return;
      const params = new URLSearchParams();
      // Preserve pagination
      const page = searchParams.get("page");
      const pageSize = searchParams.get("pageSize");
      if (page) params.set("page", page);
      if (pageSize) params.set("pageSize", pageSize);
      // Add filters
      for (const [k, v] of Object.entries(newFilters)) {
        if (v) params.set(k, v);
      }
      // Add sort
      if (sort) {
        params.set("sort", sort);
        params.set("dir", dir);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [syncUrl, searchParams, router, pathname],
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      const next = { ...filters, [key]: value };
      if (!value) delete next[key];
      setFilters(next);
      updateUrl(next, sortColumn, sortDirection);
    },
    [filters, sortColumn, sortDirection, updateUrl],
  );

  const removeFilter = useCallback(
    (key: string) => {
      const next = { ...filters };
      delete next[key];
      setFilters(next);
      updateUrl(next, sortColumn, sortDirection);
    },
    [filters, sortColumn, sortDirection, updateUrl],
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    updateUrl({}, sortColumn, sortDirection);
  }, [sortColumn, sortDirection, updateUrl]);

  const toggleSort = useCallback(
    (column: string) => {
      let nextDir: "asc" | "desc" = "asc";
      if (sortColumn === column) {
        nextDir = sortDirection === "asc" ? "desc" : "asc";
      }
      setSortColumn(column);
      setSortDirection(nextDir);
      updateUrl(filters, column, nextDir);
    },
    [sortColumn, sortDirection, filters, updateUrl],
  );

  const setSort = useCallback(
    (column: string, direction: "asc" | "desc") => {
      setSortColumn(column);
      setSortDirection(direction);
      updateUrl(filters, column, direction);
    },
    [filters, updateUrl],
  );

  const apiParams = useMemo(() => {
    const p: Record<string, string> = { ...filters };
    if (sortColumn) {
      p.sort = sortColumn;
      p.dir = sortDirection;
    }
    return p;
  }, [filters, sortColumn, sortDirection]);

  const activeFilterCount = Object.keys(filters).length;

  return {
    filters,
    sortColumn,
    sortDirection,
    setFilter,
    removeFilter,
    clearFilters,
    toggleSort,
    setSort,
    apiParams,
    activeFilterCount,
  };
}
